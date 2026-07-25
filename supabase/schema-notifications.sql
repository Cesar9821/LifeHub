-- ============================================================================
--  LIFEHUB — Notificaciones Web Push
-- ============================================================================
--  Ejecuta este archivo en el SQL Editor de Supabase, después de schema.sql.
--  Es aditivo.
--
--  push_subscriptions  -> el "endpoint" del navegador/PWA de cada usuario
--  notification_prefs  -> qué módulos quiere recibir cada usuario
--
--  El envío lo hace el cron del servidor con la SERVICE ROLE KEY (salta RLS).
--  Aquí RLS solo protege el acceso desde el cliente: cada quien ve lo suyo.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SUSCRIPCIONES PUSH (push_subscriptions)
-- ----------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,

  endpoint    text not null unique,   -- URL única del push service
  p256dh      text not null,          -- clave pública del cliente
  auth        text not null,          -- secreto de autenticación
  user_agent  text,

  created_at  timestamptz not null default now()
);

create index if not exists idx_push_subs_user on public.push_subscriptions(user_id);

-- ----------------------------------------------------------------------------
-- 2. PREFERENCIAS (notification_prefs) — un registro por usuario
-- ----------------------------------------------------------------------------
create table if not exists public.notification_prefs (
  user_id     uuid primary key references auth.users(id) on delete cascade,

  enabled     boolean not null default true,   -- interruptor general
  finanzas    boolean not null default true,   -- pagos por confirmar
  mentalidad  boolean not null default true,   -- hábitos pendientes
  familia     boolean not null default true,   -- tareas del hogar
  metas       boolean not null default true,   -- metas por vencer

  updated_at  timestamptz not null default now()
);

-- ============================================================================
--  RLS — cada usuario gestiona SOLO lo suyo (desde el cliente)
-- ============================================================================
alter table public.push_subscriptions enable row level security;
alter table public.notification_prefs enable row level security;

do $$
declare
  t text;
  tbls text[] := array['push_subscriptions','notification_prefs'];
begin
  foreach t in array tbls loop
    execute format('drop policy if exists "%s_own" on public.%I', t, t);
    execute format($f$
      create policy "%1$s_own" on public.%1$I
        for all
        using (user_id = auth.uid())
        with check (user_id = auth.uid())
    $f$, t);
  end loop;
end $$;

-- ============================================================================
--  FIN
-- ============================================================================
