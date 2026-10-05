-- ============================================================================
--  LIFEHUB — Bienestar y motivación
-- ============================================================================
--  Ejecuta este archivo completo en Supabase → SQL Editor, DESPUÉS de
--  20261005_lifehub_planning.sql. Es ADITIVO y RE-EJECUTABLE:
--    • solo crea tablas/columnas/índices/políticas "if not exists";
--    • no borra tablas, columnas ni datos;
--    • no cambia las políticas de las tablas existentes.
--
--  Tablas nuevas:
--    tip_favorites      → consejos del día que guardaste
--    family_dates       → cumpleaños y fechas especiales del hogar
--    vision_items       → tablero de visión (fotos de tus metas)
--    focus_sessions     → sesiones del modo enfoque
--
--  Columnas nuevas (opcionales, con valor por defecto):
--    daily_logs.went_well/grateful/tomorrow_first/closed_at → cierre del día
--      (el agua, el sueño y el ánimo ya viven en daily_logs)
--    weekly_plans.wheel                       → rueda de la vida de la semana
--    notification_prefs.closing_enabled/closing_time/dates_enabled
--
--  Seguridad (RLS): lo personal solo lo ve su dueño; las fechas especiales
--  las ve y edita todo el hogar.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CONSEJOS FAVORITOS
-- ----------------------------------------------------------------------------
create table if not exists public.tip_favorites (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tip_id      text not null check (char_length(tip_id) between 1 and 40),
  created_at  timestamptz not null default now(),
  primary key (user_id, tip_id)
);

-- ----------------------------------------------------------------------------
-- 2. CUMPLEAÑOS Y FECHAS ESPECIALES (compartidas con el hogar)
-- ----------------------------------------------------------------------------
create table if not exists public.family_dates (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 120),
  kind          text not null default 'cumpleanos' check (kind in ('cumpleanos','aniversario','otro')),
  month         smallint not null check (month between 1 and 12),
  day           smallint not null check (day between 1 and 31),
  year          smallint check (year between 1900 and 2100),
  notes         text check (char_length(notes) <= 300),
  created_at    timestamptz not null default now()
);

create index if not exists idx_family_dates_household on public.family_dates(household_id);

-- ----------------------------------------------------------------------------
-- 3. TABLERO DE VISIÓN (la foto se guarda reducida, como data URL JPEG)
-- ----------------------------------------------------------------------------
create table if not exists public.vision_items (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 120),
  image_data    text check (image_data is null or (image_data like 'data:image/%' and char_length(image_data) <= 700000)),
  goal_id       uuid references public.goals(id) on delete set null,
  sort          integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_vision_user on public.vision_items(user_id, sort);

-- ----------------------------------------------------------------------------
-- 4. MODO ENFOQUE
-- ----------------------------------------------------------------------------
create table if not exists public.focus_sessions (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_id       uuid references public.tasks(id) on delete set null,
  title         text check (char_length(title) <= 300),
  area          text check (area in ('trabajo','familia','salud','habitos','finanzas','proyectos','personal')),
  minutes       smallint not null check (minutes between 1 and 600),
  day           date not null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_focus_user_day on public.focus_sessions(user_id, day desc);

-- ----------------------------------------------------------------------------
-- 5. COLUMNAS NUEVAS EN TABLAS EXISTENTES (aditivas)
-- ----------------------------------------------------------------------------
-- Cierre del día (en el mismo registro diario donde ya están agua, sueño y ánimo).
alter table public.daily_logs add column if not exists went_well      text;
alter table public.daily_logs add column if not exists grateful       text;
alter table public.daily_logs add column if not exists tomorrow_first text;
alter table public.daily_logs add column if not exists closed_at      timestamptz;
-- Rueda de la vida: {"trabajo":7,"familia":8,...} (1 a 10 por área).
alter table public.weekly_plans add column if not exists wheel jsonb;
-- Avisos: cierre del día y fechas especiales.
alter table public.notification_prefs add column if not exists closing_enabled boolean not null default true;
alter table public.notification_prefs add column if not exists closing_time    time    not null default '21:30';
alter table public.notification_prefs add column if not exists dates_enabled   boolean not null default true;

-- ----------------------------------------------------------------------------
-- 6. RLS
-- ----------------------------------------------------------------------------
--  Personales (vision_items, focus_sessions):
--    solo la persona, y solo en un hogar al que pertenece.
--  tip_favorites: solo la persona (no depende del hogar).
--  family_dates: todo el hogar ve y edita; quien crea queda como dueño.
-- ----------------------------------------------------------------------------
alter table public.tip_favorites     enable row level security;
alter table public.family_dates      enable row level security;
alter table public.vision_items      enable row level security;
alter table public.focus_sessions    enable row level security;

do $$
declare
  t text;
  personal text[] := array['vision_items','focus_sessions'];
begin
  foreach t in array personal loop
    execute format('drop policy if exists "%s_own" on public.%I', t, t);
    execute format($f$
      create policy "%1$s_own" on public.%1$I for all
        using (user_id = auth.uid() and household_id in (select public.user_household_ids()))
        with check (user_id = auth.uid() and household_id in (select public.user_household_ids()))
    $f$, t);
  end loop;
end $$;

drop policy if exists "tip_favorites_own" on public.tip_favorites;
create policy "tip_favorites_own" on public.tip_favorites for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "family_dates_select" on public.family_dates;
drop policy if exists "family_dates_insert" on public.family_dates;
drop policy if exists "family_dates_update" on public.family_dates;
drop policy if exists "family_dates_delete" on public.family_dates;
create policy "family_dates_select" on public.family_dates for select
  using (household_id in (select public.user_household_ids()));
create policy "family_dates_insert" on public.family_dates for insert
  with check (household_id in (select public.user_household_ids()) and user_id = auth.uid());
create policy "family_dates_update" on public.family_dates for update
  using (household_id in (select public.user_household_ids()))
  with check (household_id in (select public.user_household_ids()));
create policy "family_dates_delete" on public.family_dates for delete
  using (household_id in (select public.user_household_ids()));

-- ============================================================================
--  FIN
-- ============================================================================
