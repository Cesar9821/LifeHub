-- ============================================================================
--  LIFEHUB — Familia v3: calendario / eventos compartidos
-- ============================================================================
--  Ejecuta después de schema-familia.sql. Aditivo.
--  Eventos COMPARTIDOS por hogar (household_id): cumpleaños, pagos, citas, etc.
-- ============================================================================

create table if not exists public.household_events (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  created_by    uuid references auth.users(id) on delete set null,

  title         text not null,
  notes         text,
  event_date    date not null,
  event_time    time,               -- opcional

  created_at    timestamptz not null default now()
);

create index if not exists idx_household_events_household on public.household_events(household_id);
create index if not exists idx_household_events_date on public.household_events(event_date);

-- ============================================================================
--  RLS — visible/editable solo por miembros del hogar
-- ============================================================================
alter table public.household_events enable row level security;

drop policy if exists "household_events_all_member" on public.household_events;
create policy "household_events_all_member" on public.household_events
  for all
  using (household_id in (select public.user_household_ids()))
  with check (household_id in (select public.user_household_ids()));

-- ============================================================================
--  FIN
-- ============================================================================
