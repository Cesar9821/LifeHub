/**
 * Tareas, capturas y trabajo: reglas puras (sin base de datos).
 * Una tarea con fecha aparece en Hoy/Semana por su fecha; NO se convierte en
 * bloque de tiempo salvo que el usuario la agende.
 */
import { addDays, weekStartOf } from './dates';
import type { Area } from './areas';

export const TASK_STATUSES = ['inbox', 'pendiente', 'hoy', 'en_curso', 'esperando', 'completado'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskKind = 'task' | 'idea' | 'reminder';

export const STATUS_LABEL: Record<TaskStatus, string> = {
  inbox: 'Sin ordenar',
  pendiente: 'Pendiente',
  hoy: 'Hoy',
  en_curso: 'En curso',
  esperando: 'Esperando',
  completado: 'Completado',
};

/** Estados que se eligen en Trabajo (en ese orden). */
export const WORK_STATUSES: TaskStatus[] = ['pendiente', 'hoy', 'en_curso', 'esperando', 'completado'];

export const WORK_CATEGORIES = [
  { value: 'instalaciones', label: 'Instalaciones' },
  { value: 'logistica', label: 'Logística' },
  { value: 'reuniones', label: 'Reuniones' },
  { value: 'capacitaciones', label: 'Capacitaciones' },
  { value: 'compras', label: 'Compras' },
  { value: 'seguimientos', label: 'Seguimientos' },
  { value: 'personal', label: 'Personal' },
  { value: 'operacion', label: 'Operación' },
] as const;

export type WorkCategory = (typeof WORK_CATEGORIES)[number]['value'];

export function categoryLabel(value: string | null | undefined): string | null {
  return WORK_CATEGORIES.find((c) => c.value === value)?.label ?? null;
}

export interface TaskLike {
  id: string;
  title: string;
  kind: TaskKind;
  status: TaskStatus;
  area: Area | null;
  category: string | null;
  due_date: string | null;
  due_time: string | null;
  planned_week: string | null;
  waiting_on: string | null;
  project_id: string | null;
  completed_at: string | null;
  created_at: string;
}

export function isOpen(t: Pick<TaskLike, 'status'>): boolean {
  return t.status !== 'completado';
}

export function isOverdue(t: Pick<TaskLike, 'status' | 'due_date'>, today: string): boolean {
  return isOpen(t) && t.status !== 'inbox' && Boolean(t.due_date && t.due_date < today);
}

/** ¿Va en la lista de Hoy? (abierta, ya ordenada, y para hoy o atrasada, o elegida para hoy). */
export function isForToday(t: Pick<TaskLike, 'status' | 'due_date'>, today: string): boolean {
  if (!isOpen(t) || t.status === 'inbox') return false;
  if (t.status === 'hoy' || t.status === 'en_curso') return true;
  return Boolean(t.due_date && t.due_date <= today);
}

/** ¿Va en la semana que empieza en `weekStart`? (por fecha o porque se planificó para esa semana). */
export function isInWeek(t: Pick<TaskLike, 'due_date' | 'planned_week'>, weekStart: string): boolean {
  const end = addDays(weekStart, 6);
  if (t.due_date) return t.due_date >= weekStart && t.due_date <= end;
  return t.planned_week === weekStart;
}

export type OrganizeTarget = 'hoy' | 'semana' | 'despues' | 'delegar';

export interface TaskPatch {
  status: TaskStatus;
  due_date?: string | null;
  planned_week?: string | null;
  waiting_on?: string | null;
}

/** Qué cambia al ordenar una captura desde la Bandeja. */
export function organizePatch(target: OrganizeTarget, today: string, waitingOn?: string | null): TaskPatch {
  switch (target) {
    case 'hoy':
      return { status: 'hoy', due_date: today };
    case 'semana':
      return { status: 'pendiente', planned_week: weekStartOf(today) };
    case 'despues':
      return { status: 'pendiente', due_date: null, planned_week: null };
    case 'delegar':
      return { status: 'esperando', waiting_on: waitingOn?.trim() || null };
  }
}

/** Cambio de estado en Trabajo: "Hoy" fija la fecha de hoy si no tenía. */
export function statusPatch(
  status: TaskStatus,
  current: Pick<TaskLike, 'due_date'>,
  today: string
): { status: TaskStatus; due_date?: string; completed_at: string | null } {
  const completed_at = status === 'completado' ? new Date().toISOString() : null;
  if (status === 'hoy' && (!current.due_date || current.due_date > today)) {
    return { status, due_date: today, completed_at };
  }
  return { status, completed_at };
}

const byDue = (a: TaskLike, b: TaskLike) =>
  (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') ||
  (a.due_time ?? '99').localeCompare(b.due_time ?? '99') ||
  a.created_at.localeCompare(b.created_at);

export interface AgendaDay<T> {
  date: string;
  tasks: T[];
}

export interface WorkAgenda<T> {
  /** Abiertas con fecha anterior a hoy. */
  atrasadas: T[];
  /** Hoy y los días siguientes (los primeros `days` siempre, aunque estén libres). */
  dias: AgendaDay<T>[];
  /** Abiertas sin fecha. */
  sinFecha: T[];
  esperando: T[];
  completadas: T[];
}

/**
 * Trabajo como agenda: cada tarea en su día. Hoy y los `days − 1` días
 * siguientes aparecen siempre (para ver los huecos); más adelante, solo los
 * días que tienen algo. "Hoy" y "En curso" sin fecha cuentan como de hoy.
 */
export function groupWorkAgenda<T extends TaskLike>(tasks: T[], today: string, days = 7, recentDays = 7): WorkAgenda<T> {
  const since = addDays(today, -recentDays);
  const a: WorkAgenda<T> = { atrasadas: [], dias: [], sinFecha: [], esperando: [], completadas: [] };
  const byDate = new Map<string, T[]>();
  for (let i = 0; i < days; i++) byDate.set(addDays(today, i), []);

  for (const t of tasks) {
    if (t.status === 'completado') {
      if ((t.completed_at ?? '').slice(0, 10) >= since) a.completadas.push(t);
      continue;
    }
    if (t.status === 'inbox') continue;
    if (t.status === 'esperando') {
      a.esperando.push(t);
      continue;
    }
    const date = t.due_date ?? (t.status === 'hoy' || t.status === 'en_curso' ? today : null);
    if (!date) a.sinFecha.push(t);
    else if (date < today) a.atrasadas.push(t);
    else byDate.set(date, [...(byDate.get(date) ?? []), t]);
  }

  const inProgressFirst = (x: TaskLike, y: TaskLike) =>
    (x.status === 'en_curso' ? 0 : 1) - (y.status === 'en_curso' ? 0 : 1) || byDue(x, y);
  a.dias = [...byDate.entries()]
    .sort(([d1], [d2]) => d1.localeCompare(d2))
    .map(([date, list]) => ({ date, tasks: list.sort(inProgressFirst) }));
  a.atrasadas.sort(byDue);
  a.sinFecha.sort(byDue);
  a.esperando.sort(byDue);
  a.completadas.sort((x, y) => (y.completed_at ?? '').localeCompare(x.completed_at ?? ''));
  return a;
}
