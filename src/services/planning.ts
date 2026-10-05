import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId, requireUser } from '@/lib/auth';
import { isMissingSchema } from '@/lib/db-errors';
import { addDays } from '@/lib/planning/dates';
import { asArea, type Area } from '@/lib/planning/areas';
import { expandRoutines, type RoutineOverride, type RoutineRule } from '@/lib/planning/recurrence';
import type { TimedItem } from '@/lib/planning/conflicts';
import { loadTasks, type Task } from './tasks';

export interface Routine extends RoutineRule {
  visibility: 'private' | 'household';
  mine: boolean;
}

export type AgendaSource = 'routine' | 'block' | 'event' | 'family' | 'task';

export interface AgendaItem {
  key: string;
  source: AgendaSource;
  /** Id de la fila (rutina, bloque, evento o tarea). */
  id: string;
  title: string;
  date: string;
  start: string | null;
  end: string | null;
  area: Area | null;
  notes: string | null;
  /** Solo rutinas: fecha original de la ocurrencia e id de la excepción. */
  occurrenceDate?: string;
  overrideId?: string | null;
  /** Solo tareas. */
  done?: boolean;
  /** Bloques/eventos/rutinas compartidos con el hogar. */
  shared?: boolean;
  mine?: boolean;
}

export interface Agenda {
  ready: boolean;
  items: AgendaItem[];
}

function rowToRoutine(r: Record<string, unknown>, me: string): Routine {
  return {
    id: r.id as string,
    title: r.title as string,
    area: asArea(r.area),
    days_of_week: ((r.days_of_week as number[]) ?? []).map(Number),
    start_time: String(r.start_time).slice(0, 5),
    end_time: String(r.end_time).slice(0, 5),
    valid_from: r.valid_from as string,
    valid_until: (r.valid_until as string) ?? null,
    active: Boolean(r.active),
    visibility: (r.visibility as 'private' | 'household') ?? 'private',
    mine: r.user_id === me,
  };
}

/** Rutinas visibles (mías + compartidas). */
export const loadRoutines = cache(async (): Promise<{ ready: boolean; routines: Routine[] }> => {
  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  const { data, error } = await supabase
    .from('routines')
    .select('id, user_id, title, area, days_of_week, start_time, end_time, valid_from, valid_until, active, visibility')
    .eq('household_id', householdId)
    .order('start_time');
  if (error) {
    if (!isMissingSchema(error)) console.error('Error cargando rutinas:', error.message);
    return { ready: !isMissingSchema(error), routines: [] };
  }
  return { ready: true, routines: ((data as Record<string, unknown>[]) ?? []).map((r) => rowToRoutine(r, user.id)) };
});

const hm = (t: unknown) => (t ? String(t).slice(0, 5) : null);

/**
 * Agenda entre `from` y `to`: ocurrencias de rutinas (expandidas al vuelo),
 * bloques y eventos puntuales, eventos familiares y tareas con hora.
 * Las tareas con fecha pero sin hora NO son bloques: van en la lista de tareas.
 */
export const loadAgenda = cache(async (from: string, to: string): Promise<Agenda> => {
  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();

  const [routinesRes, blocksRes, familyRes, tasksRes] = await Promise.all([
    loadRoutines(),
    supabase
      .from('planning_blocks')
      .select('id, user_id, kind, title, notes, area, block_date, start_time, end_time, routine_id, occurrence_date, cancelled, visibility')
      .eq('household_id', householdId)
      // Excepciones de rutinas de días cercanos (pueden moverse dentro del rango).
      .or(`and(block_date.gte.${from},block_date.lte.${to}),and(occurrence_date.gte.${addDays(from, -7)},occurrence_date.lte.${addDays(to, 7)})`),
    supabase
      .from('household_events')
      .select('*')
      .eq('household_id', householdId)
      .gte('event_date', from)
      .lte('event_date', to),
    loadTasks(),
  ]);

  const ready = routinesRes.ready && !isMissingSchema(blocksRes.error);
  if (blocksRes.error && !isMissingSchema(blocksRes.error)) console.error('Error cargando bloques:', blocksRes.error.message);
  if (familyRes.error) console.error('Error cargando eventos del hogar:', familyRes.error.message);

  const blocks = (blocksRes.data as Record<string, unknown>[]) ?? [];
  const overrides: RoutineOverride[] = blocks
    .filter((b) => b.routine_id)
    .map((b) => ({
      id: b.id as string,
      routine_id: b.routine_id as string,
      occurrence_date: b.occurrence_date as string,
      block_date: b.block_date as string,
      start_time: hm(b.start_time),
      end_time: hm(b.end_time),
      title: b.title as string,
      area: asArea(b.area),
      cancelled: Boolean(b.cancelled),
    }));

  const routineById = new Map(routinesRes.routines.map((r) => [r.id, r]));
  const items: AgendaItem[] = [];

  for (const o of expandRoutines(routinesRes.routines, overrides, from, to)) {
    const r = routineById.get(o.routineId);
    items.push({
      key: `r-${o.routineId}-${o.occurrenceDate}`,
      source: 'routine',
      id: o.routineId,
      title: o.title,
      date: o.date,
      start: o.start,
      end: o.end,
      area: o.area,
      notes: null,
      occurrenceDate: o.occurrenceDate,
      overrideId: o.overrideId,
      shared: r?.visibility === 'household',
      mine: r?.mine,
    });
  }

  for (const b of blocks) {
    if (b.routine_id) continue;
    const date = b.block_date as string;
    if (date < from || date > to) continue;
    items.push({
      key: `b-${b.id}`,
      source: b.kind === 'event' ? 'event' : 'block',
      id: b.id as string,
      title: b.title as string,
      date,
      start: hm(b.start_time),
      end: hm(b.end_time),
      area: asArea(b.area),
      notes: (b.notes as string) ?? null,
      shared: b.visibility === 'household',
      mine: b.user_id === user.id,
    });
  }

  for (const e of (familyRes.data as Record<string, unknown>[]) ?? []) {
    items.push({
      key: `f-${e.id}`,
      source: 'family',
      id: e.id as string,
      title: e.title as string,
      date: e.event_date as string,
      start: hm(e.event_time),
      end: hm(e.end_time),
      area: 'familia',
      notes: (e.notes as string) ?? null,
      shared: true,
      mine: true,
    });
  }

  for (const t of tasksRes.tasks) {
    if (!t.due_date || !t.due_time || t.due_date < from || t.due_date > to) continue;
    if (t.status === 'inbox') continue;
    items.push(taskToAgenda(t));
  }

  items.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.start ?? '').localeCompare(b.start ?? '') ||
      (a.end ?? '').localeCompare(b.end ?? '')
  );
  return { ready, items };
});

function taskToAgenda(t: Task): AgendaItem {
  return {
    key: `t-${t.id}`,
    source: 'task',
    id: t.id,
    title: t.kind === 'reminder' ? `🔔 ${t.title}` : t.title,
    date: t.due_date!,
    start: t.due_time,
    end: null,
    area: t.area,
    notes: t.notes,
    done: t.status === 'completado',
    shared: t.visibility === 'household',
    mine: t.mine,
  };
}

/** Ítems con horario para conflictos y regla 70/30 (las tareas son puntuales: no ocupan tiempo). */
export function timedItems(items: AgendaItem[]): TimedItem[] {
  return items
    .filter((i) => i.source !== 'task' && i.start && i.end)
    .map((i) => ({
      id: i.key,
      title: i.title,
      date: i.date,
      start: i.start,
      end: i.end,
      area: i.area,
      routine: i.source === 'routine',
    }));
}

/* ------------------------------------------------------------------ */
/*  Plan semanal                                                      */
/* ------------------------------------------------------------------ */

export interface WeeklyObjective {
  id: string;
  title: string;
  area: Area | null;
  done: boolean;
}

export interface WeeklyPlan {
  id: string | null;
  week_start: string;
  focus: string | null;
  objectives: WeeklyObjective[];
  planned_at: string | null;
  review_rating: number | null;
  review_improve: string | null;
  review_next_priority: string | null;
  reviewed_at: string | null;
}

export function emptyPlan(weekStart: string): WeeklyPlan {
  return {
    id: null,
    week_start: weekStart,
    focus: null,
    objectives: [],
    planned_at: null,
    review_rating: null,
    review_improve: null,
    review_next_priority: null,
    reviewed_at: null,
  };
}

export const loadWeeklyPlan = cache(async (weekStart: string): Promise<WeeklyPlan> => {
  const supabase = await createClient();
  const user = await requireUser();
  const { data, error } = await supabase
    .from('weekly_plans')
    .select('id, week_start, focus, objectives, planned_at, review_rating, review_improve, review_next_priority, reviewed_at')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .maybeSingle();
  if (error && !isMissingSchema(error)) console.error('Error cargando plan semanal:', error.message);
  if (!data) return emptyPlan(weekStart);
  const objectives = Array.isArray(data.objectives) ? (data.objectives as WeeklyObjective[]) : [];
  return {
    ...(data as Omit<WeeklyPlan, 'objectives'>),
    objectives: objectives.map((o) => ({ ...o, area: asArea(o.area), done: Boolean(o.done) })),
  };
});
