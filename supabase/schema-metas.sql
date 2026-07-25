-- ============================================================================
--  LIFEHUB — Módulo METAS (objetivos y proyectos personales)
-- ============================================================================
--  Ejecuta este archivo en el SQL Editor de Supabase, después de schema.sql.
--  Es aditivo: no toca nada existente.
--
--  Alcance: PERSONAL por usuario (user_id), igual que Mindset.
--    Cada miembro del hogar tiene sus propias metas, incluso en el mismo hogar.
--
--  Modelo:
--    goals            -> el objetivo (con fecha límite y estado)
--    goal_milestones  -> hitos/pasos del objetivo; el progreso se deriva de ellos
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. METAS (goals)
-- ----------------------------------------------------------------------------
create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  household_id  uuid references public.households(id) on delete set null,

  title         text not null,
  description   text,
  category      text default 'Personal',
  icon          text default 'Target',

  -- Estado del ciclo de vida de la meta
  status        text not null default 'active' check (status in ('active','done','archived')),

  target_date   date,          -- fecha límite (opcional)

  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz    -- se llena cuando pasa a 'done'
);

create index if not exists idx_goals_user on public.goals(user_id);

-- ----------------------------------------------------------------------------
-- 2. HITOS (goal_milestones) — los pasos que componen la meta
-- ----------------------------------------------------------------------------
create table if not exists public.goal_milestones (
  id          uuid primary key default gen_random_uuid(),
  goal_id     uuid not null references public.goals(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,

  title       text not null,
  done        boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_milestones_goal on public.goal_milestones(goal_id);
create index if not exists idx_milestones_user on public.goal_milestones(user_id);

-- ============================================================================
--  RLS — cada usuario ve SOLO sus propias metas e hitos
-- ============================================================================
alter table public.goals           enable row level security;
alter table public.goal_milestones enable row level security;

do $$
declare
  t text;
  tbls text[] := array['goals','goal_milestones'];
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
