-- ============================================================================
--  LIFEHUB — Hábitos y registro diario con la fecha de Chile
-- ============================================================================
--  Problema: el trigger que impide editar días pasados comparaba con
--  current_date (UTC). Desde las ~21:00 de Chile, UTC ya es "mañana", así que
--  lo que marcabas en la noche quedaba en el día siguiente (o fallaba).
--
--  Este archivo reemplaza SOLO esa función para usar la fecha de Chile.
--  Re-ejecutable. No toca datos. Ejecuta junto con el despliegue de la app
--  (la app ya calcula "hoy" en horario de Chile).
-- ============================================================================

create or replace function public.enforce_today_only()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.log_date <> (now() at time zone 'America/Santiago')::date) then
    raise exception 'Solo puedes registrar el día de hoy. El pasado no se edita.';
  end if;
  return new;
end;
$$;
