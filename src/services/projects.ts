import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId, requireUser } from '@/lib/auth';
import { todayStr } from '@/lib/format';
import { isMissingSchema } from '@/lib/db-errors';
import { addDays, timeToMin, weekStartOf } from '@/lib/planning/dates';

export type ProjectStatus = 'idea' | 'preparacion' | 'activo' | 'pausado' | 'terminado';
export type ProjectPriority = 'alta' | 'normal' | 'baja';

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  idea: 'Idea',
  preparacion: 'En preparación',
  activo: 'Activo',
  pausado: 'En pausa',
  terminado: 'Terminado',
};

export const PROJECT_PRIORITY_LABEL: Record<ProjectPriority, string> = {
  alta: 'Prioridad alta',
  normal: 'Prioridad normal',
  baja: 'Prioridad baja',
};

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  next_action: string | null;
  weekly_minutes: number;
  notes: string | null;
  visibility: 'private' | 'household';
  mine: boolean;
  /** Minutos agendados esta semana (bloques del proyecto). */
  scheduledMinutes: number;
}

const ORDER: Record<ProjectStatus, number> = { activo: 0, preparacion: 1, idea: 2, pausado: 3, terminado: 4 };

export const loadProjects = cache(async (): Promise<{ ready: boolean; projects: Project[] }> => {
  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  const weekStart = weekStartOf(todayStr());

  const [projRes, blocksRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id, user_id, name, status, priority, next_action, weekly_minutes, notes, visibility, sort, created_at')
      .eq('household_id', householdId)
      .order('sort')
      .order('created_at'),
    supabase
      .from('planning_blocks')
      .select('project_id, start_time, end_time')
      .eq('household_id', householdId)
      .not('project_id', 'is', null)
      .eq('cancelled', false)
      .gte('block_date', weekStart)
      .lte('block_date', addDays(weekStart, 6)),
  ]);

  if (projRes.error) {
    if (!isMissingSchema(projRes.error)) console.error('Error cargando proyectos:', projRes.error.message);
    return { ready: !isMissingSchema(projRes.error), projects: [] };
  }

  const minutes = new Map<string, number>();
  for (const b of (blocksRes.data as { project_id: string; start_time: string | null; end_time: string | null }[]) ?? []) {
    if (!b.start_time || !b.end_time) continue;
    const m = timeToMin(b.end_time) - timeToMin(b.start_time);
    minutes.set(b.project_id, (minutes.get(b.project_id) ?? 0) + Math.max(0, m));
  }

  const projects = ((projRes.data as Record<string, unknown>[]) ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    status: p.status as ProjectStatus,
    priority: p.priority as ProjectPriority,
    next_action: (p.next_action as string) ?? null,
    weekly_minutes: Number(p.weekly_minutes) || 0,
    notes: (p.notes as string) ?? null,
    visibility: (p.visibility as 'private' | 'household') ?? 'private',
    mine: p.user_id === user.id,
    scheduledMinutes: minutes.get(p.id as string) ?? 0,
  }));
  projects.sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  return { ready: true, projects };
});
