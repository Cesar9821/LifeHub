'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId, requireUser } from '@/lib/auth';
import { todayStr } from '@/lib/format';
import { errorState, parseForm, successState, zOptionalDate, zOptionalText, zRequiredText, type FormState } from '@/lib/action';
import { isMissingSchema, PLANNING_SQL_MISSING } from '@/lib/db-errors';
import { AREAS } from '@/lib/planning/areas';
import { chileToUtcIso, weekStartOf } from '@/lib/planning/dates';
import { MAX_PRIORITIES, nextPosition } from '@/lib/planning/priorities';
import { organizePatch, statusPatch, TASK_STATUSES, type OrganizeTarget, type TaskStatus } from '@/lib/planning/tasks';
import { loadPlanPage } from '@/services/plan';
import type { QuickData } from '@/components/finanzas/types';

/** Hoy, Semana, Trabajo, Capturas y Proyectos leen estas tablas. */
function revalidatePlanning() {
  revalidatePath('/', 'layout');
}

/** Mensaje amable si falla la BD (y el detalle técnico al log). */
function dbError(error: { code?: string; message: string }, context: string): FormState {
  if (isMissingSchema(error)) return errorState(PLANNING_SQL_MISSING);
  console.error(`${context}:`, error.message);
  return errorState('No pudimos guardar el cambio. Inténtalo nuevamente.');
}

const zArea = z
  .string()
  .optional()
  .transform((v) => (v && (AREAS as readonly string[]).includes(v) ? v : null));
const zTime = z
  .string()
  .optional()
  .transform((v) => (v && /^\d{2}:\d{2}/.test(v) ? v.slice(0, 5) : null));
const zVisibility = z
  .string()
  .optional()
  .transform((v) => (v === 'on' || v === 'household' ? 'household' : 'private'));

/* ------------------------------------------------------------------ */
/*  Captura rápida (+)                                                 */
/* ------------------------------------------------------------------ */

const captureSchema = z.object({
  type: z.enum(['task', 'idea', 'reminder', 'event']),
  title: zRequiredText('El texto'),
  when: z.enum(['inbox', 'hoy', 'semana']).optional(),
  area: zArea,
  date: zOptionalDate,
  time: zTime,
  end_time: zTime,
  shared: zVisibility,
});

/**
 * Guarda lo que se anotó al pasar con el mínimo de datos. Sin "cuándo", la
 * tarea queda en la Bandeja (Capturas) para ordenarla después.
 */
export async function captureItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(captureSchema, formData);
  if (!parsed.success) return parsed.state;
  const { type, title, when, area, date, time, end_time, shared } = parsed.data;

  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  const today = todayStr();

  if (type === 'event') {
    if (!date) return errorState('Revisa los datos ingresados.', { date: 'Elige el día.' });
    if (time && end_time && end_time <= time) {
      return errorState('Revisa los datos ingresados.', { end_time: 'Debe terminar después de empezar.' });
    }
    if (shared === 'household') {
      // Evento familiar: va al calendario del hogar (lo ven todos).
      const row: Record<string, unknown> = {
        household_id: householdId,
        created_by: user.id,
        title,
        event_date: date,
        event_time: time,
      };
      if (end_time) row.end_time = end_time;
      const { error } = await supabase.from('household_events').insert([row]);
      if (error) return dbError(error, 'Error creando evento del hogar');
    } else {
      const { error } = await supabase.from('planning_blocks').insert([
        {
          household_id: householdId,
          user_id: user.id,
          kind: 'event',
          title,
          area,
          block_date: date,
          start_time: time,
          end_time: time ? end_time : null,
        },
      ]);
      if (error) return dbError(error, 'Error creando evento');
    }
    revalidatePlanning();
    return successState('Evento agendado.');
  }

  if (type === 'reminder') {
    const d = date ?? today;
    if (!time) return errorState('Revisa los datos ingresados.', { time: '¿A qué hora te aviso?' });
    const { error } = await supabase.from('tasks').insert([
      {
        household_id: householdId,
        user_id: user.id,
        kind: 'reminder',
        title,
        area,
        status: 'pendiente',
        due_date: d,
        due_time: time,
        remind_at: chileToUtcIso(d, time),
      },
    ]);
    if (error) return dbError(error, 'Error creando recordatorio');
    revalidatePlanning();
    return successState('Te aviso a esa hora.');
  }

  const status = type === 'idea' || !when || when === 'inbox' ? 'inbox' : when === 'hoy' ? 'hoy' : 'pendiente';
  const { error } = await supabase.from('tasks').insert([
    {
      household_id: householdId,
      user_id: user.id,
      kind: type,
      title,
      area,
      status,
      due_date: when === 'hoy' ? today : null,
      planned_week: when === 'semana' ? weekStartOf(today) : null,
      visibility: area === 'familia' ? 'household' : 'private',
    },
  ]);
  if (error) return dbError(error, 'Error guardando captura');
  revalidatePlanning();
  return successState(status === 'inbox' ? 'Guardado en Capturas.' : when === 'hoy' ? 'Agregado a hoy.' : 'Agregado a esta semana.');
}

/* ------------------------------------------------------------------ */
/*  Tareas                                                             */
/* ------------------------------------------------------------------ */

const taskSchema = z.object({
  id: z.string().optional(),
  title: zRequiredText('La tarea'),
  notes: zOptionalText,
  area: zArea,
  category: zOptionalText,
  status: z.enum(TASK_STATUSES).optional(),
  waiting_on: zOptionalText,
  project_id: zOptionalText,
  due_date: zOptionalDate,
  due_time: zTime,
  shared: zVisibility,
});

/** Crea o edita una tarea con todos sus datos (los opcionales pueden venir vacíos). */
export async function saveTask(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(taskSchema, formData);
  if (!parsed.success) return parsed.state;
  const d = parsed.data;

  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  const status: TaskStatus = d.status ?? 'pendiente';

  const fields = {
    title: d.title,
    notes: d.notes,
    area: d.area,
    category: d.area === 'trabajo' ? d.category : null,
    status,
    waiting_on: status === 'esperando' ? d.waiting_on : null,
    project_id: d.project_id,
    due_date: d.due_date,
    due_time: d.due_date ? d.due_time : null,
    visibility: d.shared,
    completed_at: status === 'completado' ? new Date().toISOString() : null,
  };

  if (d.id) {
    const { error } = await supabase.from('tasks').update(fields).eq('id', d.id).eq('household_id', householdId);
    if (error) return dbError(error, 'Error editando tarea');
    revalidatePlanning();
    return successState('Cambios guardados.');
  }

  const { error } = await supabase
    .from('tasks')
    .insert([{ ...fields, household_id: householdId, user_id: user.id, kind: 'task' }]);
  if (error) return dbError(error, 'Error creando tarea');
  revalidatePlanning();
  return successState('Tarea agregada.');
}

/** Cambia el estado (Pendiente, Hoy, En curso, Esperando, Completado). */
export async function setTaskStatus(formData: FormData) {
  const id = String(formData.get('id') || '');
  const status = String(formData.get('status') || '') as TaskStatus;
  if (!id || !(TASK_STATUSES as readonly string[]).includes(status)) return;

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const { data: current } = await supabase
    .from('tasks')
    .select('due_date')
    .eq('id', id)
    .eq('household_id', householdId)
    .maybeSingle();
  if (!current) return;

  const patch: Record<string, unknown> = { ...statusPatch(status, current, todayStr()) };
  if (status !== 'esperando') patch.waiting_on = null;
  const waiting = String(formData.get('waiting_on') || '').trim();
  if (status === 'esperando' && waiting) patch.waiting_on = waiting;

  const { error } = await supabase.from('tasks').update(patch).eq('id', id).eq('household_id', householdId);
  if (error) console.error('Error cambiando estado:', error.message);
  revalidatePlanning();
}

/** Marca o desmarca como hecha. */
export async function toggleTaskDone(formData: FormData) {
  const id = String(formData.get('id') || '');
  const done = formData.get('done') === 'true';
  if (!id) return;
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const { error } = await supabase
    .from('tasks')
    .update(
      done
        ? { status: 'pendiente', completed_at: null }
        : { status: 'completado', completed_at: new Date().toISOString() }
    )
    .eq('id', id)
    .eq('household_id', householdId);
  if (error) console.error('Error marcando tarea:', error.message);
  revalidatePlanning();
}

/** Ordena una captura: Hoy, Esta semana, Más adelante o Delegar. */
export async function organizeTask(formData: FormData) {
  const id = String(formData.get('id') || '');
  const target = String(formData.get('target') || '') as OrganizeTarget;
  if (!id || !['hoy', 'semana', 'despues', 'delegar'].includes(target)) return;
  const area = String(formData.get('area') || '');

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const patch: Record<string, unknown> = {
    ...organizePatch(target, todayStr(), String(formData.get('waiting_on') || '')),
    kind: 'task',
  };
  if ((AREAS as readonly string[]).includes(area)) patch.area = area;

  const { error } = await supabase.from('tasks').update(patch).eq('id', id).eq('household_id', householdId);
  if (error) console.error('Error ordenando captura:', error.message);
  revalidatePlanning();
}

/** Asigna el área a una captura sin moverla de la bandeja. */
export async function setTaskArea(formData: FormData) {
  const id = String(formData.get('id') || '');
  const area = String(formData.get('area') || '');
  if (!id || !(AREAS as readonly string[]).includes(area)) return;
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const { error } = await supabase.from('tasks').update({ area }).eq('id', id).eq('household_id', householdId);
  if (error) console.error('Error asignando área:', error.message);
  revalidatePlanning();
}

export async function deleteTask(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const { error } = await supabase.from('tasks').delete().eq('id', id).eq('household_id', householdId);
  if (error) console.error('Error eliminando tarea:', error.message);
  revalidatePlanning();
}

/* ------------------------------------------------------------------ */
/*  Lo importante (máximo 3 por día)                                   */
/* ------------------------------------------------------------------ */

const prioritySchema = z.object({
  title: zOptionalText,
  task_id: zOptionalText,
  area: zArea,
});

export async function addPriority(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(prioritySchema, formData);
  if (!parsed.success) return parsed.state;
  const { task_id, area } = parsed.data;
  let { title } = parsed.data;

  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  const day = todayStr();

  let taskArea: string | null = null;
  if (task_id) {
    const { data: task } = await supabase
      .from('tasks')
      .select('title, area')
      .eq('id', task_id)
      .eq('household_id', householdId)
      .maybeSingle();
    if (!task) return errorState('No encontramos esa tarea.');
    title = title ?? (task.title as string);
    taskArea = (task.area as string) ?? null;
  }
  if (!title) return errorState('Revisa los datos ingresados.', { title: 'Escribe qué es lo importante.' });

  const { data: existing, error: readError } = await supabase
    .from('daily_priorities')
    .select('position')
    .eq('user_id', user.id)
    .eq('day', day);
  if (readError) return dbError(readError, 'Error leyendo prioridades');
  const position = nextPosition(((existing as { position: number }[]) ?? []).map((p) => Number(p.position)));
  if (position === null) {
    return errorState(`Ya tienes ${MAX_PRIORITIES} prioridades. Si esto es más importante, quita una primero.`);
  }

  const { error } = await supabase.from('daily_priorities').insert([
    { household_id: householdId, user_id: user.id, day, position, title, area: area ?? taskArea, task_id: task_id ?? null },
  ]);
  if (error) return dbError(error, 'Error guardando prioridad');
  revalidatePlanning();
  return successState('Listo.');
}

/** Marca una prioridad; si viene de una tarea, la tarea también queda completada. */
export async function togglePriority(formData: FormData) {
  const id = String(formData.get('id') || '');
  const done = formData.get('done') === 'true';
  if (!id) return;
  const supabase = await createClient();
  const user = await requireUser();
  const { data, error } = await supabase
    .from('daily_priorities')
    .update({ done: !done })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('task_id')
    .maybeSingle();
  if (error) console.error('Error marcando prioridad:', error.message);
  if (data?.task_id) {
    await supabase
      .from('tasks')
      .update(
        !done
          ? { status: 'completado', completed_at: new Date().toISOString() }
          : { status: 'hoy', completed_at: null }
      )
      .eq('id', data.task_id);
  }
  revalidatePlanning();
}

/** Quita una prioridad de hoy (la tarea, si existe, no se toca). */
export async function removePriority(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  const supabase = await createClient();
  const user = await requireUser();
  const { error } = await supabase.from('daily_priorities').delete().eq('id', id).eq('user_id', user.id);
  if (error) console.error('Error quitando prioridad:', error.message);
  revalidatePlanning();
}

/* ------------------------------------------------------------------ */
/*  Gasto desde el botón "+" (reutiliza el registro de Finanzas)        */
/* ------------------------------------------------------------------ */

/** Datos del registro rápido de gastos, cargados solo al elegir "Gasto". */
export async function getQuickExpenseData(): Promise<QuickData | null> {
  const { plan, quick } = await loadPlanPage();
  return plan.seeded ? quick : null;
}

/** Agrega como prioridad una tarea sugerida (un toque). */
export async function addPriorityFromTask(formData: FormData) {
  const result = await addPriority({ ok: false }, formData);
  if (!result.ok && result.message) console.error('Prioridad sugerida:', result.message);
}
