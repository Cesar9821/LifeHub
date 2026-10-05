import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { addDays, timeToMin } from '@/lib/planning/dates';
import { weeklyTarget } from '@/lib/planning/habits';
import { loadTasks } from './tasks';
import { loadAgenda } from './planning';
import { loadProjects } from './projects';

export interface WeekReview {
  work: { done: number; open: number; waiting: number };
  health: { trainings: number; trainingsPlanned: number; avgSleep: number | null; avgEnergy: number | null };
  family: { plannedMinutes: number; tasksDone: number };
  habits: { done: number; target: number };
  projects: { name: string; minutes: number; target: number; tasksDone: number }[];
}

const TRAINING = /gym|entren|ejercicio|deporte|correr|trote|bici|nataci/i;

function minutesOf(start: string | null, end: string | null): number {
  return start && end ? Math.max(0, timeToMin(end) - timeToMin(start)) : 0;
}

/** Métricas simples de la semana para la revisión del domingo. */
export const loadWeekReview = cache(async (weekStart: string): Promise<WeekReview> => {
  const supabase = await createClient();
  const user = await requireUser();
  const end = addDays(weekStart, 6);

  const [{ tasks }, agenda, { projects }, habitsRes, logsRes, dailyRes] = await Promise.all([
    loadTasks(),
    loadAgenda(weekStart, end),
    loadProjects(),
    supabase.from('habits').select('id, name, frequency, target_per_week, days_of_week').eq('user_id', user.id).eq('is_active', true),
    supabase.from('habit_logs').select('habit_id, log_date').eq('user_id', user.id).eq('done', true).gte('log_date', weekStart).lte('log_date', end),
    supabase.from('daily_logs').select('sleep_hours, energy').eq('user_id', user.id).gte('log_date', weekStart).lte('log_date', end),
  ]);

  const inWeek = (iso: string | null) => Boolean(iso && iso.slice(0, 10) >= weekStart && iso.slice(0, 10) <= end);
  const doneInWeek = tasks.filter((t) => t.status === 'completado' && inWeek(t.completed_at));

  const habits = (habitsRes.data as { id: string; name: string; frequency: 'daily' | 'weekly'; target_per_week: number; days_of_week?: number[] | null }[]) ?? [];
  const logs = (logsRes.data as { habit_id: string }[]) ?? [];
  const trainingIds = new Set(habits.filter((h) => TRAINING.test(h.name)).map((h) => h.id));

  const daily = (dailyRes.data as { sleep_hours: number | null; energy: number | null }[]) ?? [];
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

  return {
    work: {
      done: doneInWeek.filter((t) => t.area === 'trabajo').length,
      open: tasks.filter((t) => t.area === 'trabajo' && t.status !== 'completado' && t.status !== 'esperando').length,
      waiting: tasks.filter((t) => t.area === 'trabajo' && t.status === 'esperando').length,
    },
    health: {
      trainings: logs.filter((l) => trainingIds.has(l.habit_id)).length,
      trainingsPlanned: agenda.items.filter((i) => i.area === 'salud' && i.source !== 'task').length,
      avgSleep: avg(daily.map((d) => Number(d.sleep_hours)).filter((n) => n > 0)),
      avgEnergy: avg(daily.map((d) => Number(d.energy)).filter((n) => n > 0)),
    },
    family: {
      plannedMinutes: agenda.items.filter((i) => i.area === 'familia').reduce((a, i) => a + minutesOf(i.start, i.end), 0),
      tasksDone: doneInWeek.filter((t) => t.area === 'familia').length,
    },
    habits: {
      done: logs.length,
      target: habits.reduce(
        (a, h) =>
          a +
          weeklyTarget({
            frequency: h.frequency,
            target_per_week: Number(h.target_per_week),
            days_of_week: h.days_of_week?.length ? h.days_of_week : null,
          }),
        0
      ),
    },
    projects: projects
      .filter((p) => p.status !== 'terminado')
      .map((p) => ({
        name: p.name,
        minutes: p.scheduledMinutes,
        target: p.weekly_minutes,
        tasksDone: doneInWeek.filter((t) => t.project_id === p.id).length,
      })),
  };
});
