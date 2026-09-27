-- ============================================================================
--  LIFEHUB — Plan financiero del hogar (presupuesto mensual + deuda CMR)
-- ============================================================================
--  Ejecuta este archivo en el SQL Editor de Supabase DESPUÉS de los schema
--  anteriores. Es aditivo y se puede volver a correr sin problemas.
--
--  Modelo:
--    budget_concepts   -> conceptos del presupuesto (Arriendo, Luz, Sueldo…) con grupo
--    budget_amounts    -> monto presupuestado de cada concepto en cada mes
--    debt_items        -> compras en cuotas de la tarjeta CMR (plan casa)
--    finance_settings  -> parámetros del plan (pago fijo CMR, meses, personas)
--    movements (+cols) -> los gastos/ingresos reales: concepto, quién pagó, medio
--
--  La limpieza de los datos antiguos y la carga del plan inicial se hacen desde
--  la app (Finanzas → Presupuesto → "Cargar plan del hogar"), solo para tu hogar.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CONCEPTOS DEL PRESUPUESTO
-- ----------------------------------------------------------------------------
create table if not exists public.budget_concepts (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  kind          text not null check (kind in ('income','expense')),
  group_name    text not null default 'General',
  name          text not null,
  person        text,                              -- ingresos: de quién es el sueldo (aporte proporcional)
  is_debt_plan  boolean not null default false,    -- 'CMR plan casa': su monto sale del plan CMR
  sort          integer not null default 0,
  archived      boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (household_id, kind, name)
);

create index if not exists idx_budget_concepts_household on public.budget_concepts(household_id);

-- ----------------------------------------------------------------------------
-- 2. MONTO PRESUPUESTADO POR CONCEPTO Y MES
-- ----------------------------------------------------------------------------
create table if not exists public.budget_amounts (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  concept_id    uuid not null references public.budget_concepts(id) on delete cascade,
  month         date not null check (extract(day from month) = 1),
  amount        numeric not null default 0 check (amount >= 0),
  unique (concept_id, month)
);

create index if not exists idx_budget_amounts_household_month on public.budget_amounts(household_id, month);

-- ----------------------------------------------------------------------------
-- 3. DEUDA CMR: ÍTEMS EN CUOTAS
-- ----------------------------------------------------------------------------
create table if not exists public.debt_items (
  id                      uuid primary key default gen_random_uuid(),
  household_id            uuid not null references public.households(id) on delete cascade,
  name                    text not null,
  price                   numeric not null default 0,
  installment             numeric not null default 0,  -- valor de la cuota
  total_installments      integer not null default 0,
  remaining_installments  integer not null default 0,  -- cuotas que quedan al empezar el plan
  priority                integer not null default 99, -- 1 = se adelanta primero
  archived                boolean not null default false,
  created_at              timestamptz not null default now()
);

create index if not exists idx_debt_items_household on public.debt_items(household_id);

-- ----------------------------------------------------------------------------
-- 4. PARÁMETROS DEL PLAN
-- ----------------------------------------------------------------------------
create table if not exists public.finance_settings (
  household_id       uuid primary key references public.households(id) on delete cascade,
  cmr_fixed_payment  numeric not null default 250000,
  cmr_start_month    date not null default '2026-11-01',
  plan_start_month   date not null default '2026-10-01',
  people             text[] not null default array['Camila','César'],
  updated_at         timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. MOVIMIENTOS: concepto, ítem de deuda, quién pagó y medio de pago
-- ----------------------------------------------------------------------------
alter table public.movements
  add column if not exists concept_id     uuid references public.budget_concepts(id) on delete set null,
  add column if not exists debt_item_id   uuid references public.debt_items(id) on delete set null,
  add column if not exists paid_by        text,
  add column if not exists payment_method text;

do $$
begin
  alter table public.movements
    add constraint movements_payment_method_chk
    check (payment_method is null or payment_method in
      ('debito','credito_cmr','otra_tarjeta','efectivo','transferencia'));
exception when duplicate_object then null;
end $$;

-- Quién registró: se completa solo con el usuario de la sesión en cualquier insert.
alter table public.movements alter column created_by set default auth.uid();

create index if not exists idx_mov_concept on public.movements(concept_id);
create index if not exists idx_mov_debt_item on public.movements(debt_item_id);

-- Si un movimiento llega sin concepto (Mercado Pago, formularios antiguos),
-- lo vincula al concepto cuyo nombre coincide con su categoría.
create or replace function public.movement_resolve_concept()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.concept_id is null and new.category is not null then
    select id into new.concept_id
    from public.budget_concepts
    where household_id = new.household_id
      and kind = new.kind
      and lower(name) = lower(new.category)
      and not archived
    limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists on_movement_resolve_concept on public.movements;
create trigger on_movement_resolve_concept
  before insert or update on public.movements
  for each row execute function public.movement_resolve_concept();

-- FIX: borrar un movimiento confirmado fallaba ("tuple to be deleted was already
-- modified"). El trigger BEFORE DELETE borraba la transacción y la FK
-- (on delete set null) modificaba la misma fila que se estaba borrando.
-- Como AFTER DELETE la fila ya no existe cuando se borra la transacción.
drop trigger if exists on_movement_delete on public.movements;
create trigger on_movement_delete
  after delete on public.movements
  for each row execute function public.cleanup_movement_transaction();

-- ============================================================================
--  RLS: solo los miembros del hogar ven y editan sus datos
-- ============================================================================
alter table public.budget_concepts  enable row level security;
alter table public.budget_amounts   enable row level security;
alter table public.debt_items       enable row level security;
alter table public.finance_settings enable row level security;

do $$
declare
  t text;
  tbls text[] := array['budget_concepts','budget_amounts','debt_items','finance_settings'];
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
--  REALTIME: la app se actualiza sola cuando el otro registra algo
-- ============================================================================
do $$
declare
  t text;
  tbls text[] := array['movements','budget_concepts','budget_amounts','debt_items','finance_settings'];
begin
  foreach t in array tbls loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ============================================================================
--  FIN
-- ============================================================================
