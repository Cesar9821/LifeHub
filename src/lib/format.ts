/**
 * Utilidades de formato y fechas para LifeHub (Chile).
 * Fuente única de verdad: evita helpers duplicados por módulo.
 */

/** Formatea un número como pesos chilenos: 1000 → "$1.000". */
export function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

/** Número con separador de miles chileno, sin símbolo: 1000 → "1.000". */
export function formatNumberCL(value: number): string {
  return new Intl.NumberFormat('es-CL').format(value || 0);
}

/** Fecha de hoy (YYYY-MM-DD) en horario de Chile. */
export function todayStr(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Suma (o resta) días a una fecha YYYY-MM-DD. */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Días entre hoy y una fecha YYYY-MM-DD (positivo = futuro). */
export function daysUntil(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = Date.UTC(y, m - 1, d);
  const [ty, tm, td] = todayStr().split('-').map(Number);
  const today = Date.UTC(ty, tm - 1, td);
  return Math.round((target - today) / 86_400_000);
}

/** Etiqueta corta de fecha: "05 ago". */
export function shortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short' }).format(
    new Date(y, m - 1, d)
  );
}
