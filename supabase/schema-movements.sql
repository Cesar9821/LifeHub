-- ============================================================================
--  FINANZAS PRO — Módulo de Movimientos y Recurrentes (incremental)
-- ============================================================================
--  Ejecuta este archivo DESPUÉS de schema.sql, en el SQL Editor de Supabase.
--  Es aditivo: no borra ni modifica tus tablas actuales.
--
--  Modelo:
--    recurring_items  -> plantillas de ingresos/gastos fijos (se definen 1 vez)
--    movements        -> lo que pasa cada mes (pendiente -> confirmado + variables)
--
--  Regla: el SALDO solo cuenta movimientos CONFIRMADOS.
--  Los movimientos confirmados también se reflejan en 'transactions'
--  (vía trigger) para que el dashboard y el resto de la app sigan funcionando.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PLANTILLAS RECURRENTES (recurring_items)
-- ----------------------------------------------------------------------------
create table if not exists public.recurring_items (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  description   text not null,
  kind          text not null check (kind in ('income','expense')),
  amount        numeric not null default 0,     -- monto estimado / fijo
  is_variable   boolean not null default false, -- true = el monto cambia cada mes (luz, agua)
  due_day       integer not null check (due_day between 1 and 31),
  category      text default 'General',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists idx_recurring_household on public.recurring_items(household_id);

-- ----------------------------------------------------------------------------
-- 2. MOVIMIENTOS DEL MES (movements)
-- ----------------------------------------------------------------------------
create table if not exists public.movements (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  created_by     uuid references auth.users(id) on delete set null,
  recurring_id   uuid references public.recurring_items(id) on delete set null, -- null = variable
  description    text not null,
  kind           text not null check (kind in ('income','expense')),
  category       text default 'General',

  -- Montos: estimado (de la plantilla) y real (al confirmar)
  estimated_amount numeric not null default 0,
  actual_amount    numeric,  -- se llena al confirmar; si null, aún no confirmado

  -- Estado y fechas
  status         text not null default 'pending' check (status in ('pending','confirmed')),
  due_date       date not null,          -- cuándo vence/se espera
  confirmed_at   timestamptz,            -- cuándo se marcó como pagado/recibido

  -- Vínculo con la transacción generada (para poder revertir)
  transaction_id uuid references public.transactions(id) on delete set null,

  -- Mes al que pertenece (primer día del mes, para agrupar y evitar duplicados)
  period_month   date not null,

  created_at     timestamptz not null default now()
);

create index if not exists idx_mov_household on public.movements(household_id);
create index if not exists idx_mov_period on public.movements(period_month);
create index if not exists idx_mov_status on public.movements(status);

-- Evita generar dos veces la misma recurrente en el mismo mes
create unique index if not exists idx_mov_unique_recurring_period
  on public.movements(recurring_id, period_month)
  where recurring_id is not null;

-- ============================================================================
--  RLS
-- ============================================================================
alter table public.recurring_items enable row level security;
alter table public.movements       enable row level security;

do $$
declare
  t text;
  tbls text[] := array['recurring_items','movements'];
begin
  foreach t in array tbls loop
    execute format('drop policy if exists "%s_all_member" on public.%I', t, t);
    execute format($f$
      create policy "%1$s_all_member" on public.%1$I
        for all
        using (household_id in (select public.user_household_ids()))
        with check (household_id in (select public.user_household_ids()))
    $f$, t);
  end loop;
end $$;

-- ============================================================================
--  TRIGGER: al confirmar un movimiento -> crea transacción; al revertir -> borra
-- ============================================================================
create or replace function public.sync_movement_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signed_amount numeric;
  tx_id uuid;
begin
  -- CONFIRMAR: pasa de pending a confirmed
  if (new.status = 'confirmed' and (old.status is distinct from 'confirmed')) then
    -- gasto negativo, ingreso positivo
    signed_amount := case when new.kind = 'expense'
                          then -abs(coalesce(new.actual_amount, new.estimated_amount))
                          else  abs(coalesce(new.actual_amount, new.estimated_amount))
                     end;

    insert into public.transactions
      (household_id, created_by, description, amount, type, category, destination, created_at)
    values
      (new.household_id, new.created_by, new.description, signed_amount,
       new.kind, new.category, 'normal', coalesce(new.confirmed_at, now()))
    returning id into tx_id;

    new.transaction_id := tx_id;

  -- REVERTIR: pasa de confirmed a pending
  elsif (new.status = 'pending' and old.status = 'confirmed') then
    if old.transaction_id is not null then
      delete from public.transactions where id = old.transaction_id;
    end if;
    new.transaction_id := null;
    new.confirmed_at := null;
    new.actual_amount := null;
  end if;

  return new;
end;
$$;

drop trigger if exists on_movement_status_change on public.movements;
create trigger on_movement_status_change
  before update on public.movements
  for each row execute function public.sync_movement_transaction();

-- Al borrar un movimiento confirmado, limpia su transacción
create or replace function public.cleanup_movement_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.transaction_id is not null then
    delete from public.transactions where id = old.transaction_id;
  end if;
  return old;
end;
$$;

drop trigger if exists on_movement_delete on public.movements;
create trigger on_movement_delete
  before delete on public.movements
  for each row execute function public.cleanup_movement_transaction();

-- ============================================================================
--  MIGRACIÓN opcional: pasa tus fixed_expenses actuales a recurring_items
-- ============================================================================
insert into public.recurring_items (household_id, description, kind, amount, due_day, category, is_active)
select household_id, description, 'expense', amount, coalesce(due_day, 1), category, is_active
from public.fixed_expenses
where not exists (
  select 1 from public.recurring_items r
  where r.household_id = fixed_expenses.household_id
    and r.description = fixed_expenses.description
);

-- ============================================================================
--  FIN
-- ============================================================================
