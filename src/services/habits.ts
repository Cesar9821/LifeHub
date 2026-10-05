import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { todayStr } from '@/lib/format';
import { weekStartOf } from '@/lib/planning/dates';
import { isHabitDueOn, isPendingToday, weekDone, weeklyTarget, frequencyLabel } from '@/lib/planning/habits';
import type { Habit } from './mindset';

export interface HabitToday extends Habit {
  days_of_week: number[] | null;
  doneToday: boolean;
  dueToday: boolean;
  pendingToday: boolean;
  weekDone: number;
  weekTarget: number;
  frequencyText: string;
}

export interface HabitsToday {
  habits: HabitToday[];
  /** Hábitos que tocan hoy (diarios, del día o semanales sin cumplir). */
  dueCount: number;
  doneCount: number;
}

/**
 * Hábitos activos con el estado de hoy y de la semana (lunes a domingo).
 * Sin rachas: solo "¿lo hice hoy?" y "¿cómo voy esta semana?".
 */
export const loadHabitsToday = cache(async (): Promise<HabitsToday> => {
  const supabase = await createClient();
  const user = await requireUser();
  const today = todayStr();
  const weekStart = weekStartOf(today);

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
      .select('habit_id, log_date')
      .eq('user_id', user.id)
      .eq('done', true)
      .gte('log_date', weekStart),
  ]);
  if (habitsRes.error) console.error('Error cargando hábitos:', habitsRes.error.message);

  const byHabit = new Map<string, Set<string>>();
  for (const l of (logsRes.data as { habit_id: string; log_date: string }[]) ?? []) {
    if (!byHabit.has(l.habit_id)) byHabit.set(l.habit_id, new Set());
    byHabit.get(l.habit_id)!.add(l.log_date);
  }

  const habits: HabitToday[] = ((habitsRes.data as (Habit & { days_of_week?: number[] | null })[]) ?? []).map((h) => {
    const rule = {
      frequency: h.frequency,
      target_per_week: Number(h.target_per_week),
      days_of_week: h.days_of_week?.length ? h.days_of_week.map(Number) : null,
    };
    const dates = byHabit.get(h.id) ?? new Set<string>();
    const doneToday = dates.has(today);
    const done = weekDone(dates, weekStart);
    return {
      ...h,
      days_of_week: rule.days_of_week,
      doneToday,
      dueToday: isHabitDueOn(rule, today),
      pendingToday: isPendingToday(rule, doneToday, done, today),
      weekDone: done,
      weekTarget: weeklyTarget(rule),
      frequencyText: frequencyLabel(rule),
    };
  });

  const today_ = habits.filter((h) => h.doneToday || h.pendingToday);
  return { habits, dueCount: today_.length, doneCount: today_.filter((h) => h.doneToday).length };
});
