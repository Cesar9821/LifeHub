'use server';

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId, requireUser } from '@/lib/auth';
import { todayStr } from '@/lib/format';
import { errorState, parseForm, successState, zOptionalText, zRequiredText, type FormState } from '@/lib/action';
import { isMissingSchema, PLANNING_SQL_MISSING } from '@/lib/db-errors';
import { AREAS } from '@/lib/planning/areas';
import { addDays, isDateStr, weekStartOf } from '@/lib/planning/dates';
import { planScopeEdit, type EditScope } from '@/lib/planning/recurrence';

function revalidatePlanning() {
  revalidatePath('/', 'layout');
}

function dbError(error: { code?: string; message: string }, context: string): FormState {
  if (isMissingSchema(error)) return errorState(PLANNING_SQL_MISSING);
  console.error(`${context}:`, error.message);
  return errorState('No pudimos guardar el cambio. Inténtalo nuevamente.');
}

const zArea = z
  .string()
  .optional()
  .transform((v) => (v && (AREAS as readonly string[]).includes(v) ? v : null));
const zDate = z.string({ error: 'Elige el día.' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige el día.');
const zTime = z
  .string()
  .optional()
  .transform((v) => (v && /^\d{2}:\d{2}/.test(v) ? v.slice(0, 5) : null));
const zShared = z
  .string()
  .optional()
  .transform((v) => (v === 'on' ? 'household' : 'private'));

function checkTimes(start: string | null, end: string | null, required: boolean): Record<string, string> | null {
  if (required && !start) return { start: 'Indica a qué hora empieza.' };
  if (required && !end) return { end: 'Indica a qué hora termina.' };
  if (start && end && end <= start) return { end: 'Debe terminar después de empezar.' };
  return null;
}

/* ------------------------------------------------------------------ */
/*  Bloques y eventos puntuales                                        */
/* ------------------------------------------------------------------ */

const blockSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(['block', 'event']).default('block'),
  title: zRequiredText('El nombre'),
  notes: zOptionalText,
  area: zArea,
  date: zDate,
  start: zTime,
  end: zTime,
  shared: zShared,
  task_id: zOptionalText,
  project_id: zOptionalText,
});

export async function saveBlock(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(blockSchema, formData);
  if (!parsed.success) return parsed.state;
  const d = parsed.data;
  const bad = checkTimes(d.start, d.end, d.kind === 'block');
  if (bad) return errorState('Revisa los datos ingresados.', bad);

  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  const fields = {
    kind: d.kind,
    title: d.title,
    notes: d.notes,
    area: d.area,
    block_date: d.date,
    start_time: d.start,
    end_time: d.start ? d.end : null,
    visibility: d.shared,
    task_id: d.task_id,
    project_id: d.project_id,
  };

  const { error } = d.id
    ? await supabase.from('planning_blocks').update(fields).eq('id', d.id).eq('household_id', householdId)
    : await supabase.from('planning_blocks').insert([{ ...fields, household_id: householdId, user_id: user.id }]);
  if (error) return dbError(error, 'Error guardando bloque');
  revalidatePlanning();
  return successState(d.id ? 'Cambios guardados.' : 'Agendado.');
}

export async function deleteBlock(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const { error } = await supabase.from('planning_blocks').delete().eq('id', id).eq('household_id', householdId);
  if (error) console.error('Error eliminando bloque:', error.message);
  revalidatePlanning();
}

/* ------------------------------------------------------------------ */
/*  Eventos del hogar (calendario familiar compartido)                 */
/* ------------------------------------------------------------------ */

const familyEventSchema = z.object({
  id: z.string().min(1),
  title: zRequiredText('El nombre'),
  date: zDate,
  start: zTime,
  end: zTime,
});

export async function updateFamilyEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(familyEventSchema, formData);
  if (!parsed.success) return parsed.state;
  const d = parsed.data;
  const bad = checkTimes(d.start, d.end, false);
  if (bad) return errorState('Revisa los datos ingresados.', bad);

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const fields: Record<string, unknown> = { title: d.title, event_date: d.date, event_time: d.start };
  if (d.end || d.start) fields.end_time = d.start ? d.end : null;
  let { error } = await supabase.from('household_events').update(fields).eq('id', d.id).eq('household_id', householdId);
  // Si aún no se ejecuta el SQL nuevo (sin end_time), guarda igual lo demás.
  if (error && isMissingSchema(error)) {
    delete fields.end_time;
    ({ error } = await supabase.from('household_events').update(fields).eq('id', d.id).eq('household_id', householdId));
  }
  if (error) return dbError(error, 'Error editando evento del hogar');
  revalidatePlanning();
  return successState('Cambios guardados.');
}

/* ------------------------------------------------------------------ */
/*  Rutinas                                                            */
/* ------------------------------------------------------------------ */

const routineSchema = z.object({
  id: z.string().optional(),
  title: zRequiredText('El nombre'),
  area: zArea,
  start: zTime,
  end: zTime,
  valid_from: z.string().optional(),
  shared: zShared,
});

function daysFrom(formData: FormData): number[] {
  return [...new Set(formData.getAll('days').map(Number).filter((n) => n >= 1 && n <= 7))].sort();
}

export async function saveRoutine(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(routineSchema, formData);
  if (!parsed.success) return parsed.state;
  const d = parsed.data;
  const days = daysFrom(formData);
  if (days.length === 0) return errorState('Revisa los datos ingresados.', { days: 'Elige al menos un día.' });
  const bad = checkTimes(d.start, d.end, true);
  if (bad) return errorState('Revisa los datos ingresados.', bad);

  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  const fields = {
    title: d.title,
    area: d.area,
    days_of_week: days,
    start_time: d.start,
    end_time: d.end,
    visibility: d.shared,
  };

  const { error } = d.id
    ? await supabase.from('routines').update(fields).eq('id', d.id).eq('household_id', householdId)
    : await supabase.from('routines').insert([
        {
          ...fields,
          household_id: householdId,
          user_id: user.id,
          valid_from: isDateStr(d.valid_from) ? d.valid_from : weekStartOf(todayStr()),
        },
      ]);
  if (error) return dbError(error, 'Error guardando rutina');
  revalidatePlanning();
  return successState(d.id ? 'Rutina actualizada.' : 'Rutina creada.');
}

/** Pausa o reactiva una rutina (no borra nada). */
export async function toggleRoutineActive(formData: FormData) {
  const id = String(formData.get('id') || '');
  const active = formData.get('active') === 'true';
  if (!id) return;
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const { error } = await supabase.from('routines').update({ active: !active }).eq('id', id).eq('household_id', householdId);
  if (error) console.error('Error pausando rutina:', error.message);
  revalidatePlanning();
}

export async function deleteRoutine(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const { error } = await supabase.from('routines').delete().eq('id', id).eq('household_id', householdId);
  if (error) console.error('Error eliminando rutina:', error.message);
  revalidatePlanning();
}

/** Rutinas base de César (punto de partida, editables). */
export async function seedMyRoutines() {
  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  const from = weekStartOf(todayStr());
  const base = { household_id: householdId, user_id: user.id, valid_from: from, visibility: 'private' };
  const { error } = await supabase.from('routines').insert([
    { ...base, title: 'Gym', area: 'salud', days_of_week: [1, 3, 5], start_time: '06:00', end_time: '07:00' },
    { ...base, title: 'Inmade', area: 'trabajo', days_of_week: [1, 2, 3, 4], start_time: '08:30', end_time: '18:30' },
    { ...base, title: 'Inmade', area: 'trabajo', days_of_week: [5], start_time: '08:30', end_time: '15:30' },
  ]);
  if (error) console.error('Error cargando rutinas base:', error.message);
  revalidatePlanning();
}

/* ------------------------------------------------------------------ */
/*  Ocurrencias de rutinas: solo esta / desde esta / toda              */
/* ------------------------------------------------------------------ */

const occurrenceSchema = z.object({
  routine_id: z.string().min(1),
  occurrence_date: zDate,
  scope: z.enum(['solo', 'desde', 'toda']),
  title: zRequiredText('El nombre'),
  area: zArea,
  date: z.string().optional(),
  start: zTime,
  end: zTime,
});

type Db = Awaited<ReturnType<typeof createClient>>;

async function upsertOverride(db: Db, householdId: string, userId: string, routineId: string, occurrenceDate: string, fields: Record<string, unknown>) {
  const { data: existing } = await db
    .from('planning_blocks')
    .select('id')
    .eq('routine_id', routineId)
    .eq('occurrence_date', occurrenceDate)
    .maybeSingle();
  if (existing) return db.from('planning_blocks').update(fields).eq('id', existing.id);
  return db.from('planning_blocks').insert([
    { ...fields, household_id: householdId, user_id: userId, routine_id: routineId, occurrence_date: occurrenceDate },
  ]);
}

export async function editOccurrence(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(occurrenceSchema, formData);
  if (!parsed.success) return parsed.state;
  const d = parsed.data;
  const bad = checkTimes(d.start, d.end, true);
  if (bad) return errorState('Revisa los datos ingresados.', bad);

  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  const { data: rule, error: readError } = await supabase
    .from('routines')
    .select('*')
    .eq('id', d.routine_id)
    .eq('household_id', householdId)
    .maybeSingle();
  if (readError) return dbError(readError, 'Error leyendo rutina');
  if (!rule) return errorState('No encontramos esa rutina.');

  const plan = planScopeEdit({ valid_from: rule.valid_from as string }, d.occurrence_date, d.scope as EditScope);

  if (plan.kind === 'override') {
    const { error } = await upsertOverride(supabase, householdId, user.id, d.routine_id, d.occurrence_date, {
      kind: 'block',
      title: d.title,
      area: d.area,
      block_date: isDateStr(d.date) ? d.date : d.occurrence_date,
      start_time: d.start,
      end_time: d.end,
      cancelled: false,
      visibility: rule.visibility,
    });
    if (error) return dbError(error, 'Error editando ocurrencia');
  } else if (plan.kind === 'split') {
    const { error: e1 } = await supabase.from('routines').update({ valid_until: plan.oldUntil }).eq('id', d.routine_id);
    if (e1) return dbError(e1, 'Error cerrando rutina');
    const { error: e2 } = await supabase.from('routines').insert([
      {
        household_id: householdId,
        user_id: user.id,
        title: d.title,
        area: d.area,
        days_of_week: rule.days_of_week,
        start_time: d.start,
        end_time: d.end,
        valid_from: plan.newFrom,
        valid_until: rule.valid_until,
        active: rule.active,
        visibility: rule.visibility,
      },
    ]);
    if (e2) return dbError(e2, 'Error creando rutina nueva');
    // Las excepciones posteriores eran de la versión anterior de la rutina.
    await supabase.from('planning_blocks').delete().eq('routine_id', d.routine_id).gte('occurrence_date', plan.newFrom);
  } else {
    const { error } = await supabase
      .from('routines')
      .update({ title: d.title, area: d.area, start_time: d.start, end_time: d.end })
      .eq('id', d.routine_id);
    if (error) return dbError(error, 'Error editando rutina');
  }

  revalidatePlanning();
  return successState(
    plan.kind === 'override' ? 'Cambiado solo este día.' : plan.kind === 'split' ? 'Cambiado desde este día.' : 'Rutina actualizada.'
  );
}

/** Quita una ocurrencia: solo este día, desde este día, o toda la rutina. */
export async function removeOccurrence(formData: FormData) {
  const routineId = String(formData.get('routine_id') || '');
  const occurrenceDate = String(formData.get('occurrence_date') || '');
  const scope = String(formData.get('scope') || 'solo') as EditScope;
  if (!routineId || !isDateStr(occurrenceDate)) return;

  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  const { data: rule } = await supabase
    .from('routines')
    .select('valid_from')
    .eq('id', routineId)
    .eq('household_id', householdId)
    .maybeSingle();
  if (!rule) return;

  const plan = planScopeEdit({ valid_from: rule.valid_from as string }, occurrenceDate, scope);
  if (plan.kind === 'override') {
    // Un evento puede no tener horario: así la excepción "cancelada" cumple la
    // regla de la tabla (un bloque exige inicio y término).
    const { error } = await upsertOverride(supabase, householdId, user.id, routineId, occurrenceDate, {
      kind: 'event',
      title: 'Cancelado',
      block_date: occurrenceDate,
      start_time: null,
      end_time: null,
      cancelled: true,
    });
    if (error) console.error('Error saltando ocurrencia:', error.message);
  } else if (plan.kind === 'split') {
    await supabase.from('routines').update({ valid_until: plan.oldUntil }).eq('id', routineId);
    await supabase.from('planning_blocks').delete().eq('routine_id', routineId).gte('occurrence_date', plan.newFrom);
  } else {
    await supabase.from('routines').delete().eq('id', routineId).eq('household_id', householdId);
  }
  revalidatePlanning();
}

/* ------------------------------------------------------------------ */
/*  Plan semanal y revisión                                            */
/* ------------------------------------------------------------------ */

async function upsertPlan(weekStart: string, fields: Record<string, unknown>) {
  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  return supabase
    .from('weekly_plans')
    .upsert([{ household_id: householdId, user_id: user.id, week_start: weekStart, ...fields }], {
      onConflict: 'user_id,week_start',
    });
}

/** Foco y hasta 3 objetivos de la semana. */
export async function saveWeekGoals(_prev: FormState, formData: FormData): Promise<FormState> {
  const weekStart = String(formData.get('week_start') || '');
  if (!isDateStr(weekStart)) return errorState('Semana inválida.');
  const focus = String(formData.get('focus') || '').trim() || null;
  const titles = formData.getAll('objective').map((v) => String(v).trim());
  const areas = formData.getAll('objective_area').map(String);
  const dones = formData.getAll('objective_done').map(String);
  const ids = formData.getAll('objective_id').map(String);
  const objectives = titles
    .map((title, i) => ({
      id: ids[i] || randomUUID(),
      title,
      area: (AREAS as readonly string[]).includes(areas[i]) ? areas[i] : null,
      done: dones[i] === 'true',
    }))
    .filter((o) => o.title)
    .slice(0, 3);

  const { error } = await upsertPlan(weekStart, { focus, objectives });
  if (error) return dbError(error, 'Error guardando plan semanal');
  revalidatePlanning();
  return successState('Semana guardada.');
}

export async function toggleObjective(formData: FormData) {
  const weekStart = String(formData.get('week_start') || '');
  const id = String(formData.get('objective_id') || '');
  if (!isDateStr(weekStart) || !id) return;
  const supabase = await createClient();
  const user = await requireUser();
  const { data } = await supabase
    .from('weekly_plans')
    .select('objectives')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .maybeSingle();
  const list = Array.isArray(data?.objectives) ? (data!.objectives as { id: string; done: boolean }[]) : [];
  const next = list.map((o) => (o.id === id ? { ...o, done: !o.done } : o));
  const { error } = await supabase.from('weekly_plans').update({ objectives: next }).eq('user_id', user.id).eq('week_start', weekStart);
  if (error) console.error('Error marcando objetivo:', error.message);
  revalidatePlanning();
}

/** Planifica una tarea para esta semana (o la saca). */
export async function toggleTaskThisWeek(formData: FormData) {
  const id = String(formData.get('id') || '');
  const weekStart = String(formData.get('week_start') || '');
  const inWeek = formData.get('in_week') === 'true';
  if (!id || !isDateStr(weekStart)) return;
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const { error } = await supabase
    .from('tasks')
    .update(inWeek ? { planned_week: null } : { planned_week: weekStart, status: 'pendiente' })
    .eq('id', id)
    .eq('household_id', householdId);
  if (error) console.error('Error planificando tarea:', error.message);
  revalidatePlanning();
}

/** Paso final de "Planificar semana". */
export async function finishPlanning(formData: FormData) {
  const weekStart = String(formData.get('week_start') || '');
  if (!isDateStr(weekStart)) return;
  const { error } = await upsertPlan(weekStart, { planned_at: new Date().toISOString() });
  if (error) console.error('Error cerrando planificación:', error.message);
  revalidatePlanning();
  redirect(`/semana?semana=${weekStart}`);
}

const reviewSchema = z.object({
  week_start: zDate,
  rating: z.coerce.number().int().min(1).max(5).optional(),
  improve: zOptionalText,
  next_priority: zOptionalText,
});

/** Revisión del domingo: cómo estuvo, qué mejorar y la prioridad de la próxima semana. */
export async function saveReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(reviewSchema, formData);
  if (!parsed.success) return parsed.state;
  const d = parsed.data;

  const { error } = await upsertPlan(d.week_start, {
    review_rating: d.rating ?? null,
    review_improve: d.improve,
    review_next_priority: d.next_priority,
    reviewed_at: new Date().toISOString(),
  });
  if (error) return dbError(error, 'Error guardando revisión');

  // La prioridad elegida pasa a ser el foco de la semana siguiente.
  if (d.next_priority) {
    const supabase = await createClient();
    const user = await requireUser();
    const next = addDays(d.week_start, 7);
    const { data: existing } = await supabase
      .from('weekly_plans')
      .select('focus')
      .eq('user_id', user.id)
      .eq('week_start', next)
      .maybeSingle();
    if (!existing?.focus) await upsertPlan(next, { focus: d.next_priority });
  }

  revalidatePlanning();
  return successState('Revisión guardada. Buena semana.');
}
