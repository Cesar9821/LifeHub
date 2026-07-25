-- ============================================================================
--  LIFEHUB — Módulo FAMILIA (organización del hogar)
-- ============================================================================
--  Ejecuta este archivo en el SQL Editor de Supabase, después de schema.sql.
--  Es aditivo: no toca nada existente.
--
--  Alcance: COMPARTIDO por hogar (household_id), igual que Finanzas.
--    Todos los miembros del hogar ven y editan las mismas tareas y compras.
--
--  Modelo:
--    household_tasks  -> tareas/pendientes del hogar (asignables a un miembro)
--    shopping_items   -> lista de compras / despensa
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TAREAS DEL HOGAR (household_tasks)
-- ----------------------------------------------------------------------------
create table if not exists public.household_tasks (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  created_by    uuid references auth.users(id) on delete set null,

  title         text not null,
  notes         text,
  assigned_to   uuid references auth.users(id) on delete set null, -- null = sin asignar
  due_date      date,

  done          boolean not null default false,
  done_at       timestamptz,

  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_htasks_household on public.household_tasks(household_id);

-- ----------------------------------------------------------------------------
-- 2. LISTA DE COMPRAS (shopping_items)
-- ----------------------------------------------------------------------------
create table if not exists public.shopping_items (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  created_by    uuid references auth.users(id) on delete set null,

  name          text not null,
  quantity      text,                       -- libre: "2 kg", "3", "1 caja"
  category      text default 'General',
  checked       boolean not null default false,

  created_at    timestamptz not null default now()
);

create index if not exists idx_shopping_household on public.shopping_items(household_id);

-- ============================================================================
--  RLS — visible/editable solo por miembros del hogar
-- ============================================================================
alter table public.household_tasks enable row level security;
alter table public.shopping_items  enable row level security;

do $$
declare
  t text;
  tbls text[] := array['household_tasks','shopping_items'];
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
--  FIN
-- ============================================================================
