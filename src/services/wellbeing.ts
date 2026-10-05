import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId, requireUser } from '@/lib/auth';
import { addDays, todayStr } from '@/lib/format';
import { isMissingSchema } from '@/lib/db-errors';
import {
  activityWheel,
  average,
  parseWheel,
  prioritiesDoneDays,
  streak,
  upcomingDates,
  type FamilyDateKind,
  type UpcomingDate,
  type Wheel,
  type WheelArea,
} from '@/lib/wellbeing';

/** Mensaje cuando falta correr el SQL de bienestar. */
export const WELLBEING_SQL_MISSING =
  'Para activar esta función, ejecuta supabase/20261006_bienestar.sql en Supabase → SQL Editor.';

/** Cierre del día (vive en daily_logs, junto al agua, el sueño y el ánimo). */
export interface Reflection {
  day: string;
  mood: number | null;
  went_well: string | null;
  grateful: string | null;
  tomorrow_first: string | null;
  closed_at: string | null;
}

export interface WellbeingToday {
  /** false si aún no se ejecuta el SQL de bienestar (cierre del día y favoritos). */
  ready: boolean;
  /** Vasos de agua de hoy (de 250 ml). */
  water: number;
  sleep: number | null;
  weekWater: number | null;
  weekSleep: number | null;
  /** Cierre de hoy, si ya se hizo. */
  reflection: Reflection | null;
  closingStreak: number;
  prioritiesStreak: number;
  favorites: string[];
}

type LogRow = {
  log_date: string;
  water_ml: number | null;
  sleep_hours: number | null;
  mood: number | null;
  went_well?: string | null;
  grateful?: string | null;
  tomorrow_first?: string | null;
  closed_at?: string | null;
};

const toReflection = (r: LogRow): Reflection => ({
  day: r.log_date,
  mood: r.mood != null ? Number(r.mood) : null,
  went_well: r.went_well ?? null,
  grateful: r.grateful ?? null,
  tomorrow_first: r.tomorrow_first ?? null,
  closed_at: r.closed_at ?? null,
});

/** Todo lo de bienestar que muestra Hoy, en una sola pasada. */
export const loadWellbeingToday = cache(async (): Promise<WellbeingToday> => {
  const supabase = await createClient();
  const user = await requireUser();
  const today = todayStr();
  const since = addDays(today, -90);
  const weekAgo = addDays(today, -6);

  const logsQuery = (cols: string) =>
    supabase.from('daily_logs').select(cols).eq('user_id', user.id).gte('log_date', since).order('log_date', { ascending: false });

  const [logsFull, priorities, favorites] = await Promise.all([
    logsQuery('log_date, water_ml, sleep_hours, mood, went_well, grateful, tomorrow_first, closed_at'),
    supabase.from('daily_priorities').select('day, done').eq('user_id', user.id).gte('day', since).lte('day', today),
    supabase.from('tip_favorites').select('tip_id').eq('user_id', user.id),
  ]);

  // Sin el SQL nuevo, igual mostramos agua y sueño (ya existían).
  let ready = !(isMissingSchema(logsFull.error) || isMissingSchema(favorites.error));
  let rows = (logsFull.data as unknown as LogRow[]) ?? [];
  if (logsFull.error) {
    if (!isMissingSchema(logsFull.error)) console.error('Bienestar:', logsFull.error.message);
    const basic = await logsQuery('log_date, water_ml, sleep_hours, mood');
    rows = (basic.data as unknown as LogRow[]) ?? [];
    ready = false;
  }
  if (favorites.error && !isMissingSchema(favorites.error)) console.error('Favoritos:', favorites.error.message);

  const todayRow = rows.find((r) => r.log_date === today);
  const week = rows.filter((r) => r.log_date >= weekAgo);
  const prio = (priorities.data as { day: string; done: boolean }[]) ?? [];

  return {
    ready,
    water: Math.round(Number(todayRow?.water_ml ?? 0) / 250),
    sleep: todayRow?.sleep_hours != null && Number(todayRow.sleep_hours) > 0 ? Number(todayRow.sleep_hours) : null,
    weekWater: average(week.map((r) => (r.water_ml ? Number(r.water_ml) / 250 : null))),
    weekSleep: average(week.map((r) => (r.sleep_hours ? Number(r.sleep_hours) : null))),
    reflection: todayRow?.closed_at ? toReflection(todayRow) : null,
    closingStreak: streak(
      rows.filter((r) => r.closed_at).map((r) => r.log_date),
      today
    ),
    prioritiesStreak: priorities.error ? 0 : streak(prioritiesDoneDays(prio), today),
    favorites: ready ? ((favorites.data as { tip_id: string }[]) ?? []).map((f) => f.tip_id) : [],
  };
});

/** Cierres anteriores (para el diario). */
export const loadReflections = cache(async (limit = 60): Promise<{ ready: boolean; items: Reflection[] }> => {
  const supabase = await createClient();
  const user = await requireUser();
  const { data, error } = await supabase
    .from('daily_logs')
    .select('log_date, water_ml, sleep_hours, mood, went_well, grateful, tomorrow_first, closed_at')
    .eq('user_id', user.id)
    .not('closed_at', 'is', null)
    .order('log_date', { ascending: false })
    .limit(limit);
  if (error) {
    if (!isMissingSchema(error)) console.error('Cierres:', error.message);
    return { ready: !isMissingSchema(error), items: [] };
  }
  return { ready: true, items: ((data as unknown as LogRow[]) ?? []).map(toReflection) };
});

export interface FamilyDate {
  id: string;
  name: string;
  kind: FamilyDateKind;
  month: number;
  day: number;
  year: number | null;
  notes: string | null;
}

/** Cumpleaños y fechas especiales del hogar, ordenadas por cercanía. */
export const loadFamilyDates = cache(
  async (withinDays = 366): Promise<{ ready: boolean; upcoming: UpcomingDate<FamilyDate>[] }> => {
    const supabase = await createClient();
    const householdId = await getActiveHouseholdId();
    const { data, error } = await supabase
      .from('family_dates')
      .select('id, name, kind, month, day, year, notes')
      .eq('household_id', householdId);
    if (error) {
      if (!isMissingSchema(error)) console.error('Fechas especiales:', error.message);
      return { ready: !isMissingSchema(error), upcoming: [] };
    }
    const items = ((data as FamilyDate[]) ?? []).map((d) => ({
      ...d,
      month: Number(d.month),
      day: Number(d.day),
      year: d.year != null ? Number(d.year) : null,
    }));
    return { ready: true, upcoming: upcomingDates(items, todayStr(), withinDays) };
  }
);

export interface VisionItem {
  id: string;
  title: string;
  image_data: string | null;
  goal_id: string | null;
}

/** Tablero de visión (solo tuyo). */
export const loadVision = cache(async (): Promise<{ ready: boolean; items: VisionItem[] }> => {
  const supabase = await createClient();
  const user = await requireUser();
  const { data, error } = await supabase
    .from('vision_items')
    .select('id, title, image_data, goal_id')
    .eq('user_id', user.id)
    .order('sort', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    if (!isMissingSchema(error)) console.error('Visión:', error.message);
    return { ready: !isMissingSchema(error), items: [] };
  }
  return { ready: true, items: (data as VisionItem[]) ?? [] };
});

export interface FocusSummary {
  ready: boolean;
  todayMinutes: number;
  weekMinutes: number;
  sessionsToday: number;
}

/** Minutos de enfoque de hoy y de los últimos 7 días. */
export const loadFocusSummary = cache(async (): Promise<FocusSummary> => {
  const supabase = await createClient();
  const user = await requireUser();
  const today = todayStr();
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('day, minutes')
    .eq('user_id', user.id)
    .gte('day', addDays(today, -6));
  if (error) {
    if (!isMissingSchema(error)) console.error('Enfoque:', error.message);
    return { ready: !isMissingSchema(error), todayMinutes: 0, weekMinutes: 0, sessionsToday: 0 };
  }
  const rows = (data as { day: string; minutes: number }[]) ?? [];
  const todayRows = rows.filter((r) => r.day === today);
  return {
    ready: true,
    todayMinutes: todayRows.reduce((a, r) => a + Number(r.minutes), 0),
    weekMinutes: rows.reduce((a, r) => a + Number(r.minutes), 0),
    sessionsToday: todayRows.length,
  };
});

export interface WheelWeek {
  /** false si aún no se ejecuta el SQL de bienestar (columna weekly_plans.wheel). */
  ready: boolean;
  /** Cómo sientes cada área (lo que guardaste esta semana). */
  self: Wheel;
  /** Lo que hiciste de verdad, de 0 a 10 por área. */
  activity: Wheel;
  /** Tu rueda de la semana anterior (para comparar). */
  previous: Wheel | null;
}

const AREA_TO_WHEEL: Record<string, WheelArea> = {
  trabajo: 'trabajo',
  familia: 'familia',
  salud: 'salud',
  habitos: 'salud',
  finanzas: 'finanzas',
  proyectos: 'proyectos',
  personal: 'personal',
};

/** Rueda de la vida de una semana: tu nota por área y la actividad registrada. */
export const loadWheelWeek = cache(async (weekStart: string): Promise<WheelWeek> => {
  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  const end = addDays(weekStart, 6);
  const endExclusive = `${addDays(weekStart, 7)}T00:00:00-04:00`;
  const startTs = `${weekStart}T00:00:00-04:00`;

  const [plans, tasks, prios, habits, focus, hTasks, events, moves, logs] = await Promise.all([
    supabase.from('weekly_plans').select('week_start, wheel').eq('user_id', user.id).in('week_start', [weekStart, addDays(weekStart, -7)]),
    supabase.from('tasks').select('area, project_id').eq('user_id', user.id).eq('status', 'completado').gte('completed_at', startTs).lt('completed_at', endExclusive),
    supabase.from('daily_priorities').select('area').eq('user_id', user.id).eq('done', true).gte('day', weekStart).lte('day', end),
    supabase.from('habit_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('done', true).gte('log_date', weekStart).lte('log_date', end),
    supabase.from('focus_sessions').select('area, minutes').eq('user_id', user.id).gte('day', weekStart).lte('day', end),
    supabase.from('household_tasks').select('id', { count: 'exact', head: true }).eq('household_id', householdId).eq('done', true).gte('done_at', startTs).lt('done_at', endExclusive),
    supabase.from('household_events').select('id', { count: 'exact', head: true }).eq('household_id', householdId).gte('event_date', weekStart).lte('event_date', end),
    supabase.from('movements').select('id', { count: 'exact', head: true }).eq('created_by', user.id).gte('created_at', startTs).lt('created_at', endExclusive),
    supabase.from('daily_logs').select('sleep_hours, closed_at').eq('user_id', user.id).gte('log_date', weekStart).lte('log_date', end),
  ]);

  const ready = !isMissingSchema(plans.error);
  if (plans.error && ready) console.error('Rueda:', plans.error.message);
  const planRows = (plans.data as { week_start: string; wheel: unknown }[] | null) ?? [];
  const self = parseWheel(planRows.find((p) => p.week_start === weekStart)?.wheel);
  const prevRaw = planRows.find((p) => p.week_start === addDays(weekStart, -7))?.wheel;
  const previous = prevRaw ? parseWheel(prevRaw) : null;

  const counts: Record<WheelArea, number> = { trabajo: 0, familia: 0, salud: 0, finanzas: 0, proyectos: 0, personal: 0 };
  const add = (area: string | null | undefined, n = 1) => {
    const w = area ? AREA_TO_WHEEL[area] : undefined;
    if (w) counts[w] += n;
  };
  for (const t of (tasks.data as { area: string | null; project_id: string | null }[] | null) ?? []) add(t.project_id ? 'proyectos' : t.area);
  for (const p of (prios.data as { area: string | null }[] | null) ?? []) add(p.area);
  counts.salud += habits.count ?? 0;
  for (const f of (focus.data as { area: string | null; minutes: number }[] | null) ?? []) add(f.area ?? 'personal', Math.floor(Number(f.minutes) / 25));
  counts.familia += (hTasks.count ?? 0) + (events.count ?? 0);
  counts.finanzas += moves.count ?? 0;
  for (const l of (logs.data as { sleep_hours: number | null; closed_at?: string | null }[] | null) ?? []) {
    if (Number(l.sleep_hours) >= 7) counts.salud += 1;
    if (l.closed_at) counts.personal += 1;
  }

  return { ready, self, activity: activityWheel(counts), previous };
});
