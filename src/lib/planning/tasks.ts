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

export interface WorkGroups<T> {
  hoy: T[];
  esperando: T[];
  pendientes: T[];
  completadas: T[];
}

const byDue = (a: TaskLike, b: TaskLike) =>
  (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') ||
  (a.due_time ?? '99').localeCompare(b.due_time ?? '99') ||
  a.created_at.localeCompare(b.created_at);

/** Agrupa las tareas de trabajo: Hoy · Esperando · Pendientes · Completadas recientes. */
export function groupWorkTasks<T extends TaskLike>(tasks: T[], today: string, recentDays = 7): WorkGroups<T> {
  const since = addDays(today, -recentDays);
  const g: WorkGroups<T> = { hoy: [], esperando: [], pendientes: [], completadas: [] };
  for (const t of tasks) {
    if (t.status === 'completado') {
      if ((t.completed_at ?? '').slice(0, 10) >= since) g.completadas.push(t);
    } else if (t.status === 'esperando') g.esperando.push(t);
    else if (isForToday(t, today)) g.hoy.push(t);
    else g.pendientes.push(t);
  }
  g.hoy.sort((a, b) => {
    const rank = (t: TaskLike) => (t.status === 'en_curso' ? 0 : isOverdue(t, today) ? 1 : 2);
    return rank(a) - rank(b) || byDue(a, b);
  });
  g.esperando.sort(byDue);
  g.pendientes.sort(byDue);
  g.completadas.sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''));
  return g;
}
