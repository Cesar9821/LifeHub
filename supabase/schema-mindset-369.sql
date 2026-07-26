-- ============================================================================
--  LIFEHUB — Mentalidad: Método 369 (La Forja)
-- ============================================================================
--  Ejecuta después de schema-mindset.sql. Es aditivo.
--
--  Práctica diaria: escribes tu meta/afirmación 3 veces en la mañana,
--  6 en la tarde y 9 en la noche. Personal por usuario.
-- ============================================================================

create table if not exists public.mindset_369 (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,

  log_date    date not null,
  affirmation text,                       -- la meta/afirmación del día
  morning     integer not null default 0, -- repeticiones hechas (meta 3)
  afternoon   integer not null default 0, -- (meta 6)
  night       integer not null default 0, -- (meta 9)

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (user_id, log_date)
);

create index if not exists idx_369_user_date on public.mindset_369(user_id, log_date);

-- ============================================================================
--  RLS — cada usuario ve SOLO lo suyo
-- ============================================================================
alter table public.mindset_369 enable row level security;

drop policy if exists "mindset_369_own" on public.mindset_369;
create policy "mindset_369_own" on public.mindset_369
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
--  FIN
-- ============================================================================
