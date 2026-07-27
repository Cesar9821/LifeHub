-- ============================================================================
--  LIFEHUB — Metas v3: vincular una meta a un ahorro de Finanzas
-- ============================================================================
--  Ejecuta después de schema-metas.sql y schema.sql. Aditivo.
--  Si una meta se vincula a un ahorro, su avance (current_value) se toma
--  automáticamente del saldo de ese ahorro.
-- ============================================================================

alter table public.goals
  add column if not exists saving_id uuid references public.savings(id) on delete set null;

-- ============================================================================
--  FIN
-- ============================================================================
