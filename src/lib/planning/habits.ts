/**
 * Hábitos simples: diarios, de días específicos o con objetivo semanal.
 * Sin rachas ni medallas: solo "¿lo hice hoy?" y "¿cómo voy esta semana?".
 */
import { addDays, isoDow } from './dates';

export interface HabitRule {
  frequency: 'daily' | 'weekly';
  target_per_week: number;
  /** 1 = lunes … 7 = domingo; null = sin días fijos. */
  days_of_week: number[] | null;
}

/** ¿Corresponde hacerlo ese día? (los semanales se pueden hacer cualquier día). */
export function isHabitDueOn(h: HabitRule, date: string): boolean {
  if (h.days_of_week && h.days_of_week.length > 0) return h.days_of_week.includes(isoDow(date));
  return true;
}

/** Meta de la semana: días fijos → cuántos días; semanal → N veces; diario → 7. */
export function weeklyTarget(h: HabitRule): number {
  if (h.days_of_week && h.days_of_week.length > 0) return h.days_of_week.length;
  if (h.frequency === 'weekly') return Math.max(1, Math.min(7, h.target_per_week));
  return 7;
}

/** Veces cumplidas en la semana que empieza en `weekStart`. */
export function weekDone(doneDates: Set<string>, weekStart: string): number {
  let n = 0;
  for (let i = 0; i < 7; i++) if (doneDates.has(addDays(weekStart, i))) n++;
  return n;
}

/** Texto de frecuencia: "Todos los días", "3 veces por semana", "L · Mi · V". */
export function frequencyLabel(h: HabitRule): string {
  if (h.days_of_week && h.days_of_week.length > 0) {
    const names = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'];
    if (h.days_of_week.length === 7) return 'Todos los días';
    return [...h.days_of_week].sort((a, b) => a - b).map((d) => names[d - 1]).join(' · ');
  }
  if (h.frequency === 'weekly') return `${h.target_per_week} ${h.target_per_week === 1 ? 'vez' : 'veces'} por semana`;
  return 'Todos los días';
}

/**
 * Un semanal ya cumplido esta semana no se muestra como pendiente hoy
 * (se puede seguir marcando, pero no presiona).
 */
export function isPendingToday(h: HabitRule, doneToday: boolean, doneThisWeek: number, today: string): boolean {
  if (doneToday) return false;
  if (!isHabitDueOn(h, today)) return false;
  if (h.frequency === 'weekly' && !(h.days_of_week && h.days_of_week.length)) return doneThisWeek < weeklyTarget(h);
  return true;
}
