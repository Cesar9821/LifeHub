-- ============================================================================
--  LIFEHUB — Conexión con Mercado Pago (lectura de movimientos)
-- ============================================================================
--  Ejecuta después de schema.sql. Aditivo. Personal por usuario.
--  Guarda los tokens OAuth de Mercado Pago. NUNCA se guardan credenciales del
--  usuario: el usuario autoriza en el sitio de Mercado Pago (OAuth 2.0).
-- ============================================================================

create table if not exists public.mp_connections (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  mp_user_id    text,
  access_token  text not null,
  refresh_token text,
  expires_at    timestamptz,
  connected_at  timestamptz not null default now()
);

-- Id externo en movimientos, para no duplicar al sincronizar (mp:<payment_id>).
alter table public.movements add column if not exists external_id text;
create unique index if not exists idx_movements_external
  on public.movements(household_id, external_id) where external_id is not null;

alter table public.mp_connections enable row level security;

drop policy if exists "mp_connections_own" on public.mp_connections;
create policy "mp_connections_own" on public.mp_connections
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
--  FIN
-- ============================================================================
