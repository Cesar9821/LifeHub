-- ============================================================================
--  LIFEHUB — Familia v5: planificador de comidas (menú semanal)
-- ============================================================================
--  Ejecuta después de schema-familia.sql. Aditivo. Compartido por hogar.
-- ============================================================================

create table if not exists public.meal_plan (
  household_id uuid not null references public.households(id) on delete cascade,
  weekday      int  not null check (weekday between 0 and 6),   -- 0=Lunes … 6=Domingo
  slot         text not null check (slot in ('almuerzo', 'cena')),
  title        text not null,
  updated_at   timestamptz not null default now(),
  primary key (household_id, weekday, slot)
);

alter table public.meal_plan enable row level security;

drop policy if exists "meal_plan_all_member" on public.meal_plan;
create policy "meal_plan_all_member" on public.meal_plan
  for all
  using (household_id in (select public.user_household_ids()))
  with check (household_id in (select public.user_household_ids()));

-- ============================================================================
--  FIN
-- ============================================================================
