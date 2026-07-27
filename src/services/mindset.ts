import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  target_per_week: number;
  kind: 'build' | 'break';
  sort_order: number;
  is_active: boolean;
  non_negotiable: boolean;
}

export interface HabitWithStatus extends Habit {
  /** ¿Está marcado hoy? */
  doneToday: boolean;
  /** Días seguidos cumpliendo (racha actual) */
  streak: number;
  /** Mejor racha histórica */
  bestStreak: number;
  /** Últimos 7 días: true = cumplido */
  lastWeek: boolean[];
  /** Veces cumplido esta semana (para hábitos semanales) */
  weekCount: number;
}

/** Fecha local en formato YYYY-MM-DD */
export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

/** Resta N días a una fecha YYYY-MM-DD */
function minusDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d - days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

/**
 * Calcula la racha actual de un hábito diario.
 * Regla estricta: si falta un día (que no sea hoy), la racha se rompe.
 * Hoy sin marcar NO rompe la racha todavía (el día aún no termina).
 */
function calcStreak(doneDates: Set<string>, today: string): number {
  let streak = 0;
  // Si hoy está marcado, cuenta desde hoy. Si no, empieza desde ayer.
  let cursor = doneDates.has(today) ? today : minusDays(today, 1);

  while (doneDates.has(cursor)) {
    streak++;
    cursor = minusDays(cursor, 1);
  }
  return streak;
}

/** Mejor racha histórica a partir de las fechas cumplidas. */
function calcBestStreak(doneDates: Set<string>): number {
  if (doneDates.size === 0) return 0;
  const sorted = Array.from(doneDates).sort();
  let best = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const expected = minusDays(sorted[i], 1);
    if (sorted[i - 1] === expected) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}

/** Todos los hábitos del usuario con su estado y racha calculada. */
export async function getHabitsWithStatus(): Promise<HabitWithStatus[]> {
  const supabase = await createClient();
  const user = await requireUser();
  const today = todayStr();

  const [habitsRes, logsRes] = await Promise.all([
    supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('habit_logs')
      .select('habit_id, log_date, done')
      .eq('user_id', user.id)
      .eq('done', true)
      .gte('log_date', minusDays(today, 400)),
  ]);

  const habits = (habitsRes.data as Habit[]) || [];
  const logs = logsRes.data || [];

  // Agrupa las fechas cumplidas por hábito
  const byHabit = new Map<string, Set<string>>();
  for (const log of logs) {
    const set = byHabit.get(log.habit_id) || new Set<string>();
    set.add(log.log_date as string);
    byHabit.set(log.habit_id, set);
  }

  // Últimos 7 días (de más antiguo a hoy)
  const week = Array.from({ length: 7 }, (_, i) => minusDays(today, 6 - i));

  return habits.map((h) => {
    const dates = byHabit.get(h.id) || new Set<string>();
    const lastWeek = week.map((d) => dates.has(d));
    return {
      ...h,
      doneToday: dates.has(today),
      streak: calcStreak(dates, today),
      bestStreak: calcBestStreak(dates),
      lastWeek,
      weekCount: lastWeek.filter(Boolean).length,
    };
  });
}

export interface DailyLog {
  log_date: string;
  sleep_hours: number | null;
  mood: number | null;
  energy: number | null;
  water_ml: number;
  weight_kg: number | null;
  note: string | null;
  top_task: string | null;
  top_task_done: boolean;
  reflection: string | null;
}

/** Registro diario de hoy (si existe). */
export async function getTodayLog(): Promise<DailyLog | null> {
  const supabase = await createClient();
  const user = await requireUser();

  const { data } = await supabase
    .from('daily_logs')
    .select('log_date, sleep_hours, mood, energy, water_ml, weight_kg, note, top_task, top_task_done, reflection')
    .eq('user_id', user.id)
    .eq('log_date', todayStr())
    .maybeSingle();

  return (data as DailyLog) || null;
}

export interface MindsetSummary {
  totalHabits: number;
  doneToday: number;
  pendingToday: number;
  completionPercent: number;
  longestStreak: number;
  /** Cumplimiento de los últimos 7 días, en porcentaje */
  weekPercent: number;
}

export function summarizeHabits(habits: HabitWithStatus[]): MindsetSummary {
  const total = habits.length;
  const done = habits.filter((h) => h.doneToday).length;
  const longestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

  const weekPossible = total * 7;
  const weekDone = habits.reduce((a, h) => a + h.weekCount, 0);

  return {
    totalHabits: total,
    doneToday: done,
    pendingToday: total - done,
    completionPercent: total > 0 ? Math.round((done / total) * 100) : 0,
    longestStreak,
    weekPercent: weekPossible > 0 ? Math.round((weekDone / weekPossible) * 100) : 0,
  };
}
