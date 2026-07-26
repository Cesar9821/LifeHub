import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';

export type GoalStatus = 'active' | 'done' | 'archived';

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  motive: string | null;
  category: string;
  icon: string;
  status: GoalStatus;
  target_date: string | null;
  /** Objetivo numérico. null = meta por hitos. */
  target_value: number | null;
  current_value: number;
  unit: string | null;
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
  /** true si mide por monto/cantidad (tiene target_value). */
  measurable: boolean;
  /** 0-100. Por monto si es medible; si no, por hitos; 100 si 'done'. */
  progress: number;
  /** Días restantes hasta target_date (negativo = vencida). null si no hay fecha. */
  daysLeft: number | null;
  /** Ritmo esperado vs real. null si no aplica. */
  pace: { expectedPct: number; onTrack: boolean } | null;
}

/** Días entre dos fechas YYYY-MM-DD (b - a). */
function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** Fecha de hoy YYYY-MM-DD (local). */
function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeProgress(g: Goal, doneMilestones: number, totalMilestones: number): number {
  if (g.status === 'done') return 100;
  const target = Number(g.target_value);
  if (g.target_value != null && target > 0) {
    return Math.min(100, Math.round((Number(g.current_value) / target) * 100));
  }
  if (totalMilestones > 0) return Math.round((doneMilestones / totalMilestones) * 100);
  return 0;
}

function computePace(g: Goal, progress: number): { expectedPct: number; onTrack: boolean } | null {
  if (!g.target_date || g.status === 'done') return null;
  const start = g.created_at.slice(0, 10);
  const total = daysBetween(start, g.target_date);
  if (total <= 0) return null;
  const elapsed = Math.min(Math.max(0, daysBetween(start, todayLocal())), total);
  const expectedPct = Math.round((elapsed / total) * 100);
  return { expectedPct, onTrack: progress >= expectedPct };
}

function withProgress(goals: Goal[], byGoal: Map<string, Milestone[]>): GoalWithProgress[] {
  const today = todayLocal();
  return goals.map((g) => {
    const list = byGoal.get(g.id) || [];
    const total = list.length;
    const done = list.filter((m) => m.done).length;
    const progress = computeProgress(g, done, total);
    return {
      ...g,
      current_value: Number(g.current_value) || 0,
      target_value: g.target_value != null ? Number(g.target_value) : null,
      milestones: list,
      doneMilestones: done,
      totalMilestones: total,
      measurable: g.target_value != null && Number(g.target_value) > 0,
      progress,
      daysLeft: g.target_date ? daysBetween(today, g.target_date) : null,
      pace: computePace(g, progress),
    };
  });
}

/** Metas activas/completadas del usuario, con hitos y progreso. */
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

  return withProgress(goals, byGoal);
}

/** Metas archivadas (para el historial). */
export async function getArchivedGoals(): Promise<Goal[]> {
  const supabase = await createClient();
  const user = await requireUser();
  const { data } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'archived')
    .order('created_at', { ascending: false });
  return (data as Goal[]) || [];
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
  const overdue = active.filter((g) => g.daysLeft !== null && g.daysLeft < 0).length;

  return {
    total: goals.length,
    active: active.length,
    done,
    avgProgress,
    overdue,
  };
}
