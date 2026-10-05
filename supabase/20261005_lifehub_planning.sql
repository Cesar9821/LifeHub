-- ============================================================================
--  LIFEHUB 2.0 — Planificación: Hoy, Semana, Trabajo, Capturas y Proyectos
-- ============================================================================
--  Ejecuta este archivo completo en Supabase → SQL Editor (después de los
--  schema-*.sql anteriores). Es ADITIVO y RE-EJECUTABLE:
--    • solo crea tablas/columnas/índices/políticas "if not exists";
--    • no borra tablas, columnas ni datos;
--    • no cambia las políticas de las tablas existentes.
--
--  Tablas nuevas:
--    projects          → proyectos personales (InnVolt…)
--    tasks             → tareas, ideas, recordatorios y capturas (todas las áreas)
--    daily_priorities  → "Lo importante" del día (máximo 3, lo garantiza la BD)
--    routines          → rutinas recurrentes (reglas, no ocurrencias)
--    planning_blocks   → bloques/eventos puntuales y excepciones de rutinas
--    weekly_plans      → foco y objetivos de la semana + revisión semanal
--
--  Columnas nuevas (opcionales, con valor por defecto):
--    habits.days_of_week, household_events.end_time, goals.area,
--    notification_prefs.reminders / review_enabled / review_time
--
--  Seguridad (RLS): todo cuelga de household_id y de user_household_ids().
--  Lo personal es privado por defecto (visibility = 'private'); lo que se
--  marca 'household' lo ve y edita todo el hogar.
--
--  Días de la semana: ISO, 1 = lunes … 7 = domingo.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Utilidad: updated_at automático
-- ----------------------------------------------------------------------------
create or replace function public.lifehub_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 1. PROYECTOS
-- ----------------------------------------------------------------------------
create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references public.households(id) on delete cascade,
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 120),
  status          text not null default 'activo'
                  check (status in ('idea','preparacion','activo','pausado','terminado')),
  priority        text not null default 'normal' check (priority in ('alta','normal','baja')),
  next_action     text,
  weekly_minutes  integer not null default 0 check (weekly_minutes between 0 and 10080),
  notes           text,
  visibility      text not null default 'private' check (visibility in ('private','household')),
  sort            integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_projects_household on public.projects(household_id);

-- ----------------------------------------------------------------------------
-- 2. TAREAS / CAPTURAS
-- ----------------------------------------------------------------------------
--  status:
--    inbox      → recién capturada (Bandeja), sin clasificar
--    pendiente  → por hacer (con o sin fecha; planned_week = "esta semana")
--    hoy        → elegida para hoy
--    en_curso   → en eso
--    esperando  → depende de otra persona (waiting_on)
--    completado → lista
-- ----------------------------------------------------------------------------
create table if not exists public.tasks (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind          text not null default 'task' check (kind in ('task','idea','reminder')),
  title         text not null check (char_length(title) between 1 and 300),
  notes         text,
  area          text check (area in ('trabajo','familia','salud','habitos','finanzas','proyectos','personal')),
  category      text,
  status        text not null default 'inbox'
                check (status in ('inbox','pendiente','hoy','en_curso','esperando','completado')),
  waiting_on    text,
  project_id    uuid references public.projects(id) on delete set null,
  due_date      date,
  due_time      time,
  planned_week  date check (planned_week is null or extract(isodow from planned_week) = 1),
  remind_at     timestamptz,
  reminded_at   timestamptz,
  visibility    text not null default 'private' check (visibility in ('private','household')),
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_tasks_household_status on public.tasks(household_id, status);
create index if not exists idx_tasks_user_due on public.tasks(user_id, due_date);
create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_tasks_remind on public.tasks(remind_at) where remind_at is not null and reminded_at is null;

-- ----------------------------------------------------------------------------
-- 3. LO IMPORTANTE DEL DÍA (máximo 3 por persona y día)
-- ----------------------------------------------------------------------------
create table if not exists public.daily_priorities (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day           date not null,
  position      smallint not null check (position between 1 and 3),
  title         text not null check (char_length(title) between 1 and 200),
  area          text check (area in ('trabajo','familia','salud','habitos','finanzas','proyectos','personal')),
  task_id       uuid references public.tasks(id) on delete set null,
  done          boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (user_id, day, position)
);

create index if not exists idx_priorities_user_day on public.daily_priorities(user_id, day);

-- ----------------------------------------------------------------------------
-- 4. RUTINAS (reglas de recurrencia: no se generan ocurrencias futuras)
-- ----------------------------------------------------------------------------
create table if not exists public.routines (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 120),
  area          text check (area in ('trabajo','familia','salud','habitos','finanzas','proyectos','personal')),
  days_of_week  smallint[] not null
                check (cardinality(days_of_week) between 1 and 7 and days_of_week <@ array[1,2,3,4,5,6,7]::smallint[]),
  start_time    time not null,
  end_time      time not null,
  valid_from    date not null default current_date,
  valid_until   date,
  active        boolean not null default true,
  visibility    text not null default 'private' check (visibility in ('private','household')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (end_time > start_time),
  check (valid_until is null or valid_until >= valid_from)
);

create index if not exists idx_routines_household on public.routines(household_id);

-- ----------------------------------------------------------------------------
-- 5. BLOQUES Y EVENTOS PUNTUALES (+ excepciones de rutinas)
-- ----------------------------------------------------------------------------
--  • Bloque/evento suelto: routine_id null.
--  • Cambiar "solo esta" ocurrencia de una rutina: fila con routine_id +
--    occurrence_date (la fecha original). cancelled = true la omite.
-- ----------------------------------------------------------------------------
create table if not exists public.planning_blocks (
  id               uuid primary key default gen_random_uuid(),
  household_id     uuid not null references public.households(id) on delete cascade,
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind             text not null default 'block' check (kind in ('block','event')),
  title            text not null check (char_length(title) between 1 and 160),
  notes            text,
  area             text check (area in ('trabajo','familia','salud','habitos','finanzas','proyectos','personal')),
  block_date       date not null,
  start_time       time,
  end_time         time,
  routine_id       uuid references public.routines(id) on delete cascade,
  occurrence_date  date,
  cancelled        boolean not null default false,
  task_id          uuid references public.tasks(id) on delete set null,
  project_id       uuid references public.projects(id) on delete set null,
  visibility       text not null default 'private' check (visibility in ('private','household')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Un bloque ocupa tiempo: necesita inicio y término. Un evento puede ser de día completo.
  check (kind = 'event' or (start_time is not null and end_time is not null)),
  check (start_time is null or end_time is null or end_time > start_time),
  check ((routine_id is null) = (occurrence_date is null))
);

create unique index if not exists uq_blocks_routine_occurrence
  on public.planning_blocks(routine_id, occurrence_date) where routine_id is not null;
create index if not exists idx_blocks_household_date on public.planning_blocks(household_id, block_date);

-- ----------------------------------------------------------------------------
-- 6. PLAN SEMANAL + REVISIÓN
-- ----------------------------------------------------------------------------
create table if not exists public.weekly_plans (
  id                    uuid primary key default gen_random_uuid(),
  household_id          uuid not null references public.households(id) on delete cascade,
  user_id               uuid not null default auth.uid() references auth.users(id) on delete cascade,
  week_start            date not null check (extract(isodow from week_start) = 1),
  focus                 text,
  -- [{ "id": "...", "title": "...", "area": "trabajo", "done": false }] — máximo 3
  objectives            jsonb not null default '[]'::jsonb
                        check (jsonb_typeof(objectives) = 'array' and jsonb_array_length(objectives) <= 3),
  planned_at            timestamptz,
  review_rating         smallint check (review_rating between 1 and 5),
  review_improve        text,
  review_next_priority  text,
  reviewed_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (user_id, week_start)
);

-- ----------------------------------------------------------------------------
-- 7. COLUMNAS NUEVAS EN TABLAS EXISTENTES (aditivas)
-- ----------------------------------------------------------------------------
-- Hábitos de días específicos (null = todos los días / según frecuencia).
alter table public.habits add column if not exists days_of_week smallint[];
-- Hora de término opcional para eventos familiares.
alter table public.household_events add column if not exists end_time time;
-- Área de vida para mostrar las metas como objetivos.
alter table public.goals add column if not exists area text;
-- Avisos nuevos: recordatorios y revisión semanal del domingo.
alter table public.notification_prefs add column if not exists reminders      boolean not null default true;
alter table public.notification_prefs add column if not exists review_enabled boolean not null default true;
alter table public.notification_prefs add column if not exists review_time    time    not null default '19:00';

-- ----------------------------------------------------------------------------
-- 8. updated_at automático
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
  tbls text[] := array['projects','tasks','routines','planning_blocks','weekly_plans'];
begin
  foreach t in array tbls loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.lifehub_touch_updated_at()',
      t || '_touch', t
    );
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 9. RLS
-- ----------------------------------------------------------------------------
--  Compartibles (projects, tasks, routines, planning_blocks):
--    ver/editar   → miembro del hogar Y (es mío O está compartido)
--    crear        → miembro del hogar Y la fila es mía
--  Personales (daily_priorities, weekly_plans): solo la persona.
-- ----------------------------------------------------------------------------
alter table public.projects         enable row level security;
alter table public.tasks            enable row level security;
alter table public.daily_priorities enable row level security;
alter table public.routines         enable row level security;
alter table public.planning_blocks  enable row level security;
alter table public.weekly_plans     enable row level security;

do $$
declare
  t text;
  shared text[] := array['projects','tasks','routines','planning_blocks'];
  personal text[] := array['daily_priorities','weekly_plans'];
begin
  foreach t in array shared loop
    execute format('drop policy if exists "%s_select" on public.%I', t, t);
    execute format('drop policy if exists "%s_insert" on public.%I', t, t);
    execute format('drop policy if exists "%s_update" on public.%I', t, t);
    execute format('drop policy if exists "%s_delete" on public.%I', t, t);
    execute format($f$
      create policy "%1$s_select" on public.%1$I for select
        using (household_id in (select public.user_household_ids())
               and (user_id = auth.uid() or visibility = 'household'))
    $f$, t);
    execute format($f$
      create policy "%1$s_insert" on public.%1$I for insert
        with check (household_id in (select public.user_household_ids()) and user_id = auth.uid())
    $f$, t);
    execute format($f$
      create policy "%1$s_update" on public.%1$I for update
        using (household_id in (select public.user_household_ids())
               and (user_id = auth.uid() or visibility = 'household'))
        with check (household_id in (select public.user_household_ids())
                    and (user_id = auth.uid() or visibility = 'household'))
    $f$, t);
    execute format($f$
      create policy "%1$s_delete" on public.%1$I for delete
        using (household_id in (select public.user_household_ids())
               and (user_id = auth.uid() or visibility = 'household'))
    $f$, t);
  end loop;

  foreach t in array personal loop
    execute format('drop policy if exists "%s_own" on public.%I', t, t);
    execute format($f$
      create policy "%1$s_own" on public.%1$I for all
        using (user_id = auth.uid() and household_id in (select public.user_household_ids()))
        with check (user_id = auth.uid() and household_id in (select public.user_household_ids()))
    $f$, t);
  end loop;
end $$;

-- ============================================================================
--  FIN
-- ============================================================================
