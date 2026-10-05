/**
 * Rutinas recurrentes: se guardan como REGLAS (días + horario + vigencia) y
 * se expanden al vuelo para el rango que se está mirando. Nunca se generan
 * cientos de filas futuras. Los cambios de "solo esta" ocurrencia se guardan
 * como excepciones (planning_blocks con routine_id + occurrence_date).
 */
import { addDays, daysBetween, isoDow } from './dates';
import type { Area } from './areas';

export interface RoutineRule {
  id: string;
  title: string;
  area: Area | null;
  /** 1 = lunes … 7 = domingo */
  days_of_week: number[];
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  valid_from: string; // YYYY-MM-DD
  valid_until: string | null;
  active: boolean;
}

export interface RoutineOverride {
  id: string;
  routine_id: string;
  /** Fecha original de la ocurrencia que se modifica. */
  occurrence_date: string;
  /** Fecha en que queda (puede moverse a otro día). */
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  title: string;
  area: Area | null;
  cancelled: boolean;
}

export interface Occurrence {
  routineId: string;
  /** Fecha original (clave para editar "solo esta"). */
  occurrenceDate: string;
  date: string;
  start: string;
  end: string;
  title: string;
  area: Area | null;
  /** Id de la excepción si esta ocurrencia fue modificada. */
  overrideId: string | null;
}

/** ¿La regla produce una ocurrencia ese día? */
export function occursOn(rule: RoutineRule, date: string): boolean {
  if (!rule.active) return false;
  if (date < rule.valid_from) return false;
  if (rule.valid_until && date > rule.valid_until) return false;
  return rule.days_of_week.includes(isoDow(date));
}

/** Ocurrencias de las rutinas entre `from` y `to` (inclusive), ordenadas. */
export function expandRoutines(
  rules: RoutineRule[],
  overrides: RoutineOverride[],
  from: string,
  to: string
): Occurrence[] {
  const span = daysBetween(from, to);
  if (span < 0) return [];

  const byKey = new Map(overrides.map((o) => [`${o.routine_id}|${o.occurrence_date}`, o]));
  const ruleById = new Map(rules.map((r) => [r.id, r]));
  const out: Occurrence[] = [];
  const used = new Set<string>();

  const push = (rule: RoutineRule, occurrenceDate: string) => {
    const key = `${rule.id}|${occurrenceDate}`;
    const ov = byKey.get(key);
    if (ov) {
      used.add(key);
      if (ov.cancelled) return;
      if (ov.block_date < from || ov.block_date > to) return;
      out.push({
        routineId: rule.id,
        occurrenceDate,
        date: ov.block_date,
        start: (ov.start_time ?? rule.start_time).slice(0, 5),
        end: (ov.end_time ?? rule.end_time).slice(0, 5),
        title: ov.title || rule.title,
        area: ov.area ?? rule.area,
        overrideId: ov.id,
      });
      return;
    }
    out.push({
      routineId: rule.id,
      occurrenceDate,
      date: occurrenceDate,
      start: rule.start_time.slice(0, 5),
      end: rule.end_time.slice(0, 5),
      title: rule.title,
      area: rule.area,
      overrideId: null,
    });
  };

  for (let i = 0; i <= span; i++) {
    const date = addDays(from, i);
    for (const rule of rules) if (occursOn(rule, date)) push(rule, date);
  }

  // Ocurrencias de otros días que se movieron DENTRO del rango.
  for (const ov of overrides) {
    const key = `${ov.routine_id}|${ov.occurrence_date}`;
    if (used.has(key) || ov.cancelled) continue;
    const rule = ruleById.get(ov.routine_id);
    if (!rule || !occursOn(rule, ov.occurrence_date)) continue;
    if (ov.block_date >= from && ov.block_date <= to) push(rule, ov.occurrence_date);
  }

  return out.sort((a, b) => (a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date)));
}

export type EditScope = 'solo' | 'desde' | 'toda';

export type ScopePlan =
  | { kind: 'override'; occurrenceDate: string }
  | { kind: 'split'; oldUntil: string; newFrom: string }
  | { kind: 'all' };

/**
 * Qué hacer al editar/borrar una ocurrencia según el alcance elegido:
 *  - solo esta  → guardar una excepción para esa fecha
 *  - desde esta → cerrar la regla el día anterior y crear una nueva desde esa fecha
 *                 (si es la primera ocurrencia, equivale a toda la rutina)
 *  - toda       → cambiar la regla completa
 */
export function planScopeEdit(rule: Pick<RoutineRule, 'valid_from'>, occurrenceDate: string, scope: EditScope): ScopePlan {
  if (scope === 'solo') return { kind: 'override', occurrenceDate };
  if (scope === 'desde' && occurrenceDate > rule.valid_from) {
    return { kind: 'split', oldUntil: addDays(occurrenceDate, -1), newFrom: occurrenceDate };
  }
  return { kind: 'all' };
}

/** "L · Mi · V" a partir de [1,3,5]. */
export function daysLabel(days: number[]): string {
  const names = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'];
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 7) return 'Todos los días';
  if (sorted.join() === '1,2,3,4,5') return 'Lunes a viernes';
  if (sorted.join() === '1,2,3,4') return 'Lunes a jueves';
  if (sorted.join() === '6,7') return 'Fines de semana';
  return sorted.map((d) => names[d - 1]).join(' · ');
}
