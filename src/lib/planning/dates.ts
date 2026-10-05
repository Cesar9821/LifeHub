/**
 * Fechas de la planificación, siempre en horario de Chile y con semanas de
 * lunes a domingo. Las fechas viajan como texto YYYY-MM-DD y las horas como
 * HH:MM (sin zona horaria), igual que en la base de datos.
 */
import { addDays } from '../format';

export { addDays };

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_SHORT = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
export const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function parts(date: string): [number, number, number] {
  const [y, m, d] = date.split('-').map(Number);
  return [y, m, d];
}

/** Día ISO de la semana: 1 = lunes … 7 = domingo. */
export function isoDow(date: string): number {
  const [y, m, d] = parts(date);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = domingo
  return dow === 0 ? 7 : dow;
}

/** Lunes de la semana de `date`. */
export function weekStartOf(date: string): string {
  return addDays(date, 1 - isoDow(date));
}

/** Los 7 días (lunes → domingo) de la semana que empieza en `weekStart`. */
export function weekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/** Días entre dos fechas (b − a). */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = parts(a);
  const [by, bm, bd] = parts(b);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** "06:30" → 390 */
export function timeToMin(time: string): number {
  const [h, m] = time.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

/** 390 → "06:30" */
export function minToTime(min: number): string {
  const m = Math.max(0, Math.min(24 * 60, Math.round(min)));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** "08:30:00" → "08:30" */
export function hhmm(time: string | null | undefined): string | null {
  return time ? time.slice(0, 5) : null;
}

/** Duración legible: 90 → "1 h 30 min", 60 → "1 h", 45 → "45 min". */
export function durationLabel(min: number): string {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
}

/** "Lunes 5 de octubre" */
export function longDateLabel(date: string): string {
  const [, m, d] = parts(date);
  return `${DAY_NAMES[isoDow(date) - 1]} ${d} de ${MONTHS[m - 1]}`;
}

/** "lun 5" */
export function shortDayLabel(date: string): string {
  return `${DAY_SHORT[isoDow(date) - 1]} ${parts(date)[2]}`;
}

/** Nombre del día: "Miércoles" */
export function dayName(date: string): string {
  return DAY_NAMES[isoDow(date) - 1];
}

/** "5 – 11 oct" o "29 sep – 5 oct" */
export function weekRangeLabel(weekStart: string): string {
  const end = addDays(weekStart, 6);
  const [, m1, d1] = parts(weekStart);
  const [, m2, d2] = parts(end);
  return m1 === m2
    ? `${d1} – ${d2} ${MONTHS_SHORT[m2 - 1]}`
    : `${d1} ${MONTHS_SHORT[m1 - 1]} – ${d2} ${MONTHS_SHORT[m2 - 1]}`;
}

/** Hora actual "HH:MM" en Chile. */
export function nowTimeChile(now = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);
}

/** Saludo según la hora de Chile. */
export function greetingFor(time: string): string {
  const h = Number(time.slice(0, 2));
  if (h >= 5 && h < 12) return 'Buenos días';
  if (h >= 12 && h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Valida "YYYY-MM-DD". */
export function isDateStr(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

/** Desfase (minutos) de Chile respecto de UTC en un instante dado. */
function chileOffsetMin(utcMs: number): number {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return Math.round((asUtc - utcMs) / 60_000);
}

/** Fecha y hora de Chile ("2026-10-05", "09:30") → ISO en UTC (para timestamptz). */
export function chileToUtcIso(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.slice(0, 5).split(':').map(Number);
  const naive = Date.UTC(y, m - 1, d, h, min);
  let utc = naive - chileOffsetMin(naive) * 60_000;
  utc = naive - chileOffsetMin(utc) * 60_000; // segunda pasada por si cruza el cambio de hora
  return new Date(utc).toISOString();
}
