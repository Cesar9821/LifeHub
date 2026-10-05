/** ¿El error indica que falta una tabla/columna (SQL aún no ejecutado)? */
export function isMissingSchema(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === '42P01' || // tabla no existe
    error.code === '42703' || // columna no existe
    error.code === 'PGRST205' ||
    error.code === 'PGRST204' ||
    /does not exist|schema cache/i.test(error.message ?? '')
  );
}

/** Mensaje para el usuario cuando falta ejecutar el SQL de planificación. */
export const PLANNING_SQL_MISSING =
  'Falta preparar la base de datos: ejecuta supabase/20261005_lifehub_planning.sql en Supabase.';
