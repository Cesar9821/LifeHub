-- ============================================================================
--  LIFEHUB — Mentalidad v2: La Rana, Reflexión nocturna e Innegociables
-- ============================================================================
--  Ejecuta después de schema-mindset.sql. Aditivo.
-- ============================================================================

-- La Rana del día (tarea #1) y reflexión nocturna → en el registro diario.
alter table public.daily_logs add column if not exists top_task       text;
alter table public.daily_logs add column if not exists top_task_done  boolean not null default false;
alter table public.daily_logs add column if not exists reflection     text;

-- Hábitos innegociables (los que NO se negocian jamás).
alter table public.habits add column if not exists non_negotiable boolean not null default false;

-- ============================================================================
--  FIN
-- ============================================================================
