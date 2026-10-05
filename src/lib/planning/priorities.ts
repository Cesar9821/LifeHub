/**
 * "Lo importante": máximo 3 prioridades por día. La base de datos lo
 * garantiza (posición 1..3 única por día); aquí están las reglas de la UI.
 */
import { isOverdue, type TaskLike } from './tasks';

export const MAX_PRIORITIES = 3;

/** Primera posición libre (1..3) o null si ya hay 3. */
export function nextPosition(used: number[]): number | null {
  for (let p = 1; p <= MAX_PRIORITIES; p++) if (!used.includes(p)) return p;
  return null;
}

export function canAddPriority(count: number): boolean {
  return count < MAX_PRIORITIES;
}

/**
 * Sugerencias para elegir lo importante: lo atrasado primero, luego lo que
 * está en curso, lo elegido para hoy y lo que vence hoy. Excluye lo que ya
 * es prioridad.
 */
export function suggestPriorities<T extends TaskLike>(tasks: T[], today: string, chosenTaskIds: string[], limit = 5): T[] {
  const score = (t: TaskLike): number => {
    if (isOverdue(t, today)) return 0;
    if (t.status === 'en_curso') return 1;
    if (t.status === 'hoy') return 2;
    if (t.due_date === today) return 3;
    return 9;
  };
  return tasks
    .filter((t) => t.status !== 'completado' && t.status !== 'inbox' && !chosenTaskIds.includes(t.id))
    .map((t) => ({ t, s: score(t) }))
    .filter(({ s }) => s < 9)
    .sort((a, b) => a.s - b.s || (a.t.due_date ?? '').localeCompare(b.t.due_date ?? ''))
    .slice(0, limit)
    .map(({ t }) => t);
}
