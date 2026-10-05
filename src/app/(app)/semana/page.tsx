import { todayStr } from '@/lib/format';
import { addDays, isDateStr, nowTimeChile, weekStartOf } from '@/lib/planning/dates';
import { loadTasks } from '@/services/tasks';
import { loadAgenda, loadRoutines, loadWeeklyPlan } from '@/services/planning';
import { RefreshOnFocus } from '@/components/planning/refresh-on-focus';
import { SemanaView } from './semana-view';

export const dynamic = 'force-dynamic';

export default async function SemanaPage({ searchParams }: { searchParams: Promise<{ semana?: string; dia?: string }> }) {
  const params = await searchParams;
  const today = todayStr();
  const base = isDateStr(params.dia) ? params.dia : isDateStr(params.semana) ? params.semana : today;
  const weekStart = weekStartOf(base);
  const selected = isDateStr(params.dia) ? params.dia : weekStartOf(today) === weekStart ? today : weekStart;

  const [agenda, tasksData, plan, routines] = await Promise.all([
    loadAgenda(weekStart, addDays(weekStart, 6)),
    loadTasks(),
    loadWeeklyPlan(weekStart),
    loadRoutines(),
  ]);

  return (
    <>
      <RefreshOnFocus />
      <SemanaView
        today={today}
        now={nowTimeChile()}
        weekStart={weekStart}
        selected={selected}
        ready={agenda.ready && tasksData.ready}
        agenda={agenda.items}
        tasks={tasksData.tasks}
        plan={plan}
        routinesCount={routines.routines.filter((r) => r.active).length}
      />
    </>
  );
}
