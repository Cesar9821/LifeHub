-- ============================================================================
--  LIFEHUB — Notificaciones v2: horarios configurables + anti-duplicados
-- ============================================================================
--  Ejecuta después de schema-notifications.sql. Aditivo.
-- ============================================================================

-- Horas por tipo de aviso (por usuario) + alerta de saldo bajo.
alter table public.notification_prefs add column if not exists forja_time           time not null default '06:00';
alter table public.notification_prefs add column if not exists m369_morning_time     time not null default '09:00';
alter table public.notification_prefs add column if not exists m369_afternoon_time   time not null default '14:00';
alter table public.notification_prefs add column if not exists m369_night_time       time not null default '21:00';
alter table public.notification_prefs add column if not exists digest_time           time not null default '09:00';
alter table public.notification_prefs add column if not exists low_balance_enabled   boolean not null default false;
alter table public.notification_prefs add column if not exists low_balance_threshold numeric not null default 0;

-- Registro de envíos: garantiza "una vez al día por tipo" (idempotencia).
create table if not exists public.notification_sends (
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null,
  sent_date   date not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, kind, sent_date)
);

alter table public.notification_sends enable row level security;

drop policy if exists "notification_sends_own" on public.notification_sends;
create policy "notification_sends_own" on public.notification_sends
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
--  FIN
-- ============================================================================
