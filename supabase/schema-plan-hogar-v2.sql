-- ============================================================================
--  LIFEHUB — Plan del hogar v2: cuentas del mes
-- ============================================================================
--  Ejecuta DESPUÉS de schema-plan-hogar.sql. Es aditivo y re-ejecutable.
--
--  Cada concepto es:
--    'cuenta' -> se paga (o recibe) una vez al mes: Arriendo, Luz, Sueldo…
--                Aparece en "Cuentas del mes" con su botón Pagar / Recibí.
--    'bolsa'  -> varios gastos durante el mes: Supermercado, Ocio…
--                Se registra con "+ Gasto" y se controla con su barra.
--  due_day: día del mes en que vence (opcional) para ordenar y recordar.
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'budget_concepts' and column_name = 'pay_mode'
  ) then
    alter table public.budget_concepts
      add column pay_mode text not null default 'bolsa' check (pay_mode in ('cuenta','bolsa')),
      add column due_day  integer check (due_day between 1 and 31);

    -- Solo la primera vez: marca como cuenta lo que se paga una vez al mes.
    update public.budget_concepts
    set pay_mode = 'cuenta'
    where name in (
      'Sueldo Camila', 'Sueldo César',
      'Arriendo', 'Gastos comunes', 'Garantía (segunda mitad)',
      'Luz', 'Agua', 'Gas', 'Internet / TV', 'Celulares',
      'CMR Camila', 'CMR César', 'CMR plan casa',
      'Cuidado Valentín y Sarah'
    );
  end if;
end $$;

-- ============================================================================
--  FIN
-- ============================================================================
