/**
 * Bienestar: rachas, agua y sueño, fechas especiales y rueda de la vida.
 * Reglas puras (sin base de datos), con fechas YYYY-MM-DD de Chile.
 */
import { addDays } from './format';

/* ------------------------------------------------------------------ */
/*  Rachas                                                            */
/* ------------------------------------------------------------------ */

/**
 * Días seguidos hasta hoy. Si hoy todavía no cuenta, la racha sigue viva
 * desde ayer (no se "pierde" a las 9 de la mañana).
 */
export function streak(days: Iterable<string>, today: string): number {
  const set = new Set(days);
  let d = set.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** Días en que se cumplió todo "Lo importante" (al menos una prioridad y todas hechas). */
export function prioritiesDoneDays(rows: { day: string; done: boolean }[]): string[] {
  const byDay = new Map<string, { total: number; done: number }>();
  for (const r of rows) {
    const s = byDay.get(r.day) ?? { total: 0, done: 0 };
    s.total++;
    if (r.done) s.done++;
    byDay.set(r.day, s);
  }
  return [...byDay.entries()].filter(([, s]) => s.total > 0 && s.done === s.total).map(([d]) => d);
}

/** Texto amable para una racha (o null si no hay). */
export function streakLabel(n: number, what: string): string | null {
  if (n <= 0) return null;
  return n === 1 ? `1 día ${what}` : `${n} días seguidos ${what}`;
}

/** Ánimo del día (1 a 5), igual que en el registro diario. */
export const MOODS = [
  { value: '1', label: '😞', name: 'Mal' },
  { value: '2', label: '🙁', name: 'Regular' },
  { value: '3', label: '😐', name: 'Normal' },
  { value: '4', label: '🙂', name: 'Bien' },
  { value: '5', label: '😄', name: 'Muy bien' },
];

/* ------------------------------------------------------------------ */
/*  Agua y sueño                                                      */
/* ------------------------------------------------------------------ */

export const WATER_GOAL = 8; // vasos (~2 litros)
export const SLEEP_GOAL = 7; // horas
export const MAX_GLASSES = 30;

export function clampGlasses(n: number): number {
  return Math.max(0, Math.min(MAX_GLASSES, Math.round(n)));
}

/** Promedio con un decimal de los valores presentes (null si no hay). */
export function average(values: (number | null | undefined)[]): number | null {
  const v = values.filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
  if (v.length === 0) return null;
  return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10;
}

export function sleepMessage(hours: number | null): string | null {
  if (hours == null) return null;
  if (hours < 6) return 'Dormiste poco: hoy baja la vara y prioriza lo importante.';
  if (hours < SLEEP_GOAL) return 'Un poco menos de lo ideal. Intenta acostarte más temprano hoy.';
  return 'Buen descanso. Aprovecha la energía.';
}

/* ------------------------------------------------------------------ */
/*  Cumpleaños y fechas especiales                                    */
/* ------------------------------------------------------------------ */

export type FamilyDateKind = 'cumpleanos' | 'aniversario' | 'otro';

export const FAMILY_DATE_KIND_LABEL: Record<FamilyDateKind, string> = {
  cumpleanos: 'Cumpleaños',
  aniversario: 'Aniversario',
  otro: 'Fecha especial',
};

export const FAMILY_DATE_EMOJI: Record<FamilyDateKind, string> = {
  cumpleanos: '🎂',
  aniversario: '💞',
  otro: '⭐',
};

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Fecha válida en ese año (29 de febrero cae el 28 en años no bisiestos). */
function dateInYear(y: number, month: number, day: number): string {
  const d = month === 2 && day === 29 && !isLeap(y) ? 28 : Math.min(day, daysInMonth(y, month));
  return `${y}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Próxima vez que cae la fecha (hoy incluido). */
export function nextOccurrence(month: number, day: number, today: string): string {
  const y = Number(today.slice(0, 4));
  const thisYear = dateInYear(y, month, day);
  return thisYear >= today ? thisYear : dateInYear(y + 1, month, day);
}

export function daysUntil(date: string, today: string): number {
  const [a, b] = [today, date].map((s) => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  });
  return Math.round((b - a) / 86_400_000);
}

/** Años que se cumplen en la próxima ocurrencia (null si no se sabe el año). */
export function turning(year: number | null | undefined, next: string): number | null {
  if (!year) return null;
  const n = Number(next.slice(0, 4)) - year;
  return n > 0 ? n : null;
}

export function whenLabel(days: number): string {
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  if (days < 7) return `En ${days} días`;
  if (days < 14) return 'La próxima semana';
  return `En ${days} días`;
}

export interface UpcomingDate<T> {
  item: T;
  date: string;
  days: number;
  turning: number | null;
}

/** Fechas ordenadas por cercanía (las de los próximos `withinDays` días). */
export function upcomingDates<T extends { month: number; day: number; year?: number | null }>(
  items: T[],
  today: string,
  withinDays = 366
): UpcomingDate<T>[] {
  return items
    .map((item) => {
      const date = nextOccurrence(item.month, item.day, today);
      return { item, date, days: daysUntil(date, today), turning: turning(item.year, date) };
    })
    .filter((u) => u.days <= withinDays)
    .sort((a, b) => a.days - b.days);
}

/* ------------------------------------------------------------------ */
/*  Rueda de la vida                                                  */
/* ------------------------------------------------------------------ */

export const WHEEL_AREAS = ['trabajo', 'familia', 'salud', 'finanzas', 'proyectos', 'personal'] as const;
export type WheelArea = (typeof WHEEL_AREAS)[number];
export type Wheel = Record<WheelArea, number | null>;

export const WHEEL_LABEL: Record<WheelArea, string> = {
  trabajo: 'Trabajo',
  familia: 'Familia',
  salud: 'Salud',
  finanzas: 'Finanzas',
  proyectos: 'Proyectos',
  personal: 'Personal',
};

export const WHEEL_HINT: Record<WheelArea, string> = {
  trabajo: '¿Avanzaste en lo que importa? ¿Con qué carga?',
  familia: '¿Tiempo de calidad con los tuyos?',
  salud: 'Sueño, movimiento, comida, energía.',
  finanzas: '¿Tranquilo con la plata este mes?',
  proyectos: '¿Le diste tiempo a InnVolt y a tus ideas?',
  personal: 'Descanso, gustos, crecimiento, ánimo.',
};

export function emptyWheel(): Wheel {
  return Object.fromEntries(WHEEL_AREAS.map((a) => [a, null])) as Wheel;
}

/** Lee la rueda guardada (jsonb), descartando valores fuera de 1–10. */
export function parseWheel(raw: unknown): Wheel {
  const w = emptyWheel();
  if (!raw || typeof raw !== 'object') return w;
  for (const a of WHEEL_AREAS) {
    const v = Number((raw as Record<string, unknown>)[a]);
    if (Number.isFinite(v) && v >= 1 && v <= 10) w[a] = Math.round(v);
  }
  return w;
}

export function wheelFilled(w: Wheel): boolean {
  return WHEEL_AREAS.every((a) => w[a] != null);
}

export function wheelAverage(w: Wheel): number | null {
  return average(WHEEL_AREAS.map((a) => w[a]));
}

/** El área más baja (para sugerir dónde poner atención la próxima semana). */
export function weakestArea(w: Wheel): WheelArea | null {
  let best: WheelArea | null = null;
  for (const a of WHEEL_AREAS) {
    const v = w[a];
    if (v == null) continue;
    if (best == null || v < (w[best] as number)) best = a;
  }
  return best;
}

/**
 * Actividad real de la semana por área, de 0 a 10: cada acción suma
 * (tareas hechas, prioridades cumplidas, hábitos, enfoque…) hasta la meta.
 */
export const ACTIVITY_TARGET: Record<WheelArea, number> = {
  trabajo: 12,
  familia: 6,
  salud: 10,
  finanzas: 5,
  proyectos: 5,
  personal: 6,
};

export function activityWheel(counts: Partial<Record<WheelArea, number>>): Wheel {
  const w = emptyWheel();
  for (const a of WHEEL_AREAS) {
    const n = counts[a] ?? 0;
    w[a] = Math.round(Math.min(10, (n / ACTIVITY_TARGET[a]) * 10));
  }
  return w;
}
