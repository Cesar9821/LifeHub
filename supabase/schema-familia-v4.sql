-- ============================================================================
--  LIFEHUB — Familia v4: tareas recurrentes
-- ============================================================================
--  Ejecuta después de schema-familia.sql. Aditivo.
--  Al completar una tarea recurrente, se genera la siguiente automáticamente.
-- ============================================================================

alter table public.household_tasks
  add column if not exists repeat text not null default 'none'
  check (repeat in ('none', 'weekly', 'monthly'));

-- ============================================================================
--  FIN
-- ============================================================================
