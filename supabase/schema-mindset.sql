-- ============================================================================
--  LIFEHUB — Módulo MINDSET (hábitos y disciplina)
-- ============================================================================
--  Ejecuta este archivo en el SQL Editor de Supabase, después de schema.sql
--  y schema-movements.sql. Es aditivo: no toca nada existente.
--
--  DIFERENCIA CLAVE con Finanzas:
--    Finanzas = datos COMPARTIDOS por hogar (household_id)
--    Mindset  = datos PERSONALES por usuario (user_id)
--  Cada miembro del hogar tiene sus propios hábitos y su propia racha.
--
--  Filosofía "estricta": los registros del pasado no se editan.
--  Solo puedes marcar/desmarcar el día de HOY. La racha se rompe y se ve.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HÁBITOS (habits) — lo que quieres sostener
-- ----------------------------------------------------------------------------
create table if not exists public.habits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete set null,

  name         text not null,
  description  text,
  icon         text default 'Flame',
  color        text default '#6366f1',

  -- Frecuencia: 'daily' = todos los días
  --             'weekly' = target_per_week veces por semana
  frequency        text not null default 'daily' check (frequency in ('daily','weekly')),
  target_per_week  integer not null default 7 check (target_per_week between 1 and 7),

  -- Tipo: 'build' = quiero hacerlo (entrenar), 'break' = quiero evitarlo (no alcohol)
  kind         text not null default 'build' check (kind in ('build','break')),

  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists idx_habits_user on public.habits(user_id);

-- ----------------------------------------------------------------------------
-- 2. REGISTROS DE HÁBITOS (habit_logs) — el check de cada día
-- ----------------------------------------------------------------------------
create table if not exists public.habit_logs (
  id         uuid primary key default gen_random_uuid(),
  habit_id   uuid not null references public.habits(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,

  log_date   date not null,
  done       boolean not null default true,
  note       text,

  created_at timestamptz not null default now(),

  -- Un solo registro por hábito por día
  unique (habit_id, log_date)
);

create index if not exists idx_habit_logs_user on public.habit_logs(user_id);
create index if not exists idx_habit_logs_date on public.habit_logs(log_date);
create index if not exists idx_habit_logs_habit_date on public.habit_logs(habit_id, log_date);

-- ----------------------------------------------------------------------------
-- 3. REGISTRO DIARIO (daily_logs) — sueño, ánimo, energía, agua, peso
-- ----------------------------------------------------------------------------
create table if not exists public.daily_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,

  log_date    date not null,
  sleep_hours numeric,
  mood        integer check (mood between 1 and 5),
  energy      integer check (energy between 1 and 5),
  water_ml    integer default 0,
  weight_kg   numeric,
  note        text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (user_id, log_date)
);

create index if not exists idx_daily_logs_user_date on public.daily_logs(user_id, log_date);

-- ============================================================================
--  RLS — cada usuario ve SOLO sus propios datos
-- ============================================================================
alter table public.habits     enable row level security;
alter table public.habit_logs enable row level security;
alter table public.daily_logs enable row level security;

do $$
declare
  t text;
  tbls text[] := array['habits','habit_logs','daily_logs'];
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
--  REGLA ESTRICTA: no se puede registrar ni modificar el pasado
-- ============================================================================
--  Solo se permite insertar/actualizar logs con fecha = hoy.
--  Esto es lo que hace que la racha sea real y no se pueda "arreglar".
-- ============================================================================
create or replace function public.enforce_today_only()
returns trigger
language plpgsql
as $$
begin
  if (new.log_date <> current_date) then
    raise exception 'Solo puedes registrar el día de hoy. El pasado no se edita.';
  end if;
  return new;
end;
$$;

drop trigger if exists habit_logs_today_only on public.habit_logs;
create trigger habit_logs_today_only
  before insert or update on public.habit_logs
  for each row execute function public.enforce_today_only();

drop trigger if exists daily_logs_today_only on public.daily_logs;
create trigger daily_logs_today_only
  before insert or update on public.daily_logs
  for each row execute function public.enforce_today_only();

-- ============================================================================
--  FIN
-- ============================================================================
