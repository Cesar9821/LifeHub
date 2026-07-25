import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';

export type GoalStatus = 'active' | 'done' | 'archived';

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  icon: string;
  status: GoalStatus;
  target_date: string | null;
  sort_order: number;
  created_at: string;
  completed_at: string | null;
}

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  done: boolean;
  sort_order: number;
}

export interface GoalWithProgress extends Goal {
  milestones: Milestone[];
  doneMilestones: number;
  totalMilestones: number;
  /** 0-100. Derivado de los hitos; si no hay, 100 cuando está 'done', si no 0. */
  progress: number;
  /** Días restantes hasta target_date (negativo = vencida). null si no hay fecha. */
  daysLeft: number | null;
}

/** Días entre hoy y una fecha YYYY-MM-DD (positivo = futuro). */
function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** Todas las metas del usuario con sus hitos y progreso calculado. */
export async function getGoals(): Promise<GoalWithProgress[]> {
  const supabase = await createClient();
  const user = await requireUser();

  const [goalsRes, milestonesRes] = await Promise.all([
    supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'archived')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('goal_milestones')
      .select('id, goal_id, title, done, sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
  ]);

  const goals = (goalsRes.data as Goal[]) || [];
  const milestones = (milestonesRes.data as Milestone[]) || [];

  const byGoal = new Map<string, Milestone[]>();
  for (const m of milestones) {
    const list = byGoal.get(m.goal_id) || [];
    list.push(m);
    byGoal.set(m.goal_id, list);
  }

  return goals.map((g) => {
    const list = byGoal.get(g.id) || [];
    const total = list.length;
    const done = list.filter((m) => m.done).length;
    const progress =
      g.status === 'done'
        ? 100
        : total > 0
          ? Math.round((done / total) * 100)
          : 0;
    return {
      ...g,
      milestones: list,
      doneMilestones: done,
      totalMilestones: total,
      progress,
      daysLeft: g.target_date ? daysUntil(g.target_date) : null,
    };
  });
}

export interface MetasSummary {
  total: number;
  active: number;
  done: number;
  /** Progreso promedio de las metas activas, en porcentaje. */
  avgProgress: number;
  /** Metas activas con fecha límite ya vencida. */
  overdue: number;
}

export function summarizeGoals(goals: GoalWithProgress[]): MetasSummary {
  const active = goals.filter((g) => g.status === 'active');
  const done = goals.filter((g) => g.status === 'done').length;
  const avgProgress =
    active.length > 0
      ? Math.round(active.reduce((a, g) => a + g.progress, 0) / active.length)
      : 0;
  const overdue = active.filter(
    (g) => g.daysLeft !== null && g.daysLeft < 0
  ).length;

  return {
    total: goals.length,
    active: active.length,
    done,
    avgProgress,
    overdue,
  };
}
