import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId, requireUser } from '@/lib/auth';
import { addDays, todayStr } from '@/lib/format';
import { isMissingSchema } from '@/lib/db-errors';
import { asArea } from '@/lib/planning/areas';
import type { TaskKind, TaskLike, TaskStatus } from '@/lib/planning/tasks';

export interface Task extends TaskLike {
  notes: string | null;
  remind_at: string | null;
  visibility: 'private' | 'household';
  user_id: string;
  /** ¿La creé yo? (las compartidas pueden ser de otra persona del hogar) */
  mine: boolean;
}

export interface Priority {
  id: string;
  position: number;
  title: string;
  area: string | null;
  task_id: string | null;
  done: boolean;
}

export interface TasksData {
  /** false si aún no se ejecuta el SQL de planificación. */
  ready: boolean;
  tasks: Task[];
}

const TASK_COLUMNS =
  'id, user_id, kind, title, notes, area, category, status, waiting_on, project_id, due_date, due_time, planned_week, remind_at, visibility, completed_at, created_at';

function toTask(r: Record<string, unknown>, me: string): Task {
  return {
    id: r.id as string,
    user_id: r.user_id as string,
    mine: r.user_id === me,
    kind: r.kind as TaskKind,
    title: r.title as string,
    notes: (r.notes as string) ?? null,
    area: asArea(r.area),
    category: (r.category as string) ?? null,
    status: r.status as TaskStatus,
    waiting_on: (r.waiting_on as string) ?? null,
    project_id: (r.project_id as string) ?? null,
    due_date: (r.due_date as string) ?? null,
    due_time: r.due_time ? String(r.due_time).slice(0, 5) : null,
    planned_week: (r.planned_week as string) ?? null,
    remind_at: (r.remind_at as string) ?? null,
    visibility: (r.visibility as 'private' | 'household') ?? 'private',
    completed_at: (r.completed_at as string) ?? null,
    created_at: r.created_at as string,
  };
}

/**
 * Tareas visibles para mí (mías + compartidas del hogar): todas las abiertas
 * y las completadas de las últimas 2 semanas. Una carga por request.
 */
export const loadTasks = cache(async (): Promise<TasksData> => {
  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  const since = `${addDays(todayStr(), -14)}T00:00:00Z`;

  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_COLUMNS)
    .eq('household_id', householdId)
    .or(`status.neq.completado,completed_at.gte.${since}`)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    if (!isMissingSchema(error)) console.error('Error cargando tareas:', error.message);
    return { ready: !isMissingSchema(error), tasks: [] };
  }
  return { ready: true, tasks: ((data as Record<string, unknown>[]) ?? []).map((r) => toTask(r, user.id)) };
});

/** Prioridades del día (máximo 3), ordenadas por posición. */
export const loadPriorities = cache(async (day: string): Promise<Priority[]> => {
  const supabase = await createClient();
  const user = await requireUser();
  const { data, error } = await supabase
    .from('daily_priorities')
    .select('id, position, title, area, task_id, done')
    .eq('user_id', user.id)
    .eq('day', day)
    .order('position');
  if (error) {
    if (!isMissingSchema(error)) console.error('Error cargando prioridades:', error.message);
    return [];
  }
  return ((data as Priority[]) ?? []).map((p) => ({ ...p, position: Number(p.position) }));
});

/** "La Rana" del registro diario de hoy (para mostrarla como prioridad si no hay otras). */
export const loadFrog = cache(async (day: string): Promise<{ title: string; done: boolean } | null> => {
  const supabase = await createClient();
  const user = await requireUser();
  const { data } = await supabase
    .from('daily_logs')
    .select('top_task, top_task_done')
    .eq('user_id', user.id)
    .eq('log_date', day)
    .maybeSingle();
  const title = (data?.top_task as string | null) ?? null;
  return title ? { title, done: Boolean(data?.top_task_done) } : null;
});
