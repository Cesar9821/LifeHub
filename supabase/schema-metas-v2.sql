-- ============================================================================
--  LIFEHUB — Metas v2: medibles por monto + motivo
-- ============================================================================
--  Ejecuta después de schema-metas.sql. Solo AGREGA columnas (no borra datos).
-- ============================================================================

alter table public.goals add column if not exists motive        text;
alter table public.goals add column if not exists target_value  numeric;            -- objetivo numérico (null = meta por hitos)
alter table public.goals add column if not exists current_value numeric not null default 0; -- avance acumulado
alter table public.goals add column if not exists unit          text;               -- '$', 'libros', 'km'…

-- ============================================================================
--  FIN
-- ============================================================================
