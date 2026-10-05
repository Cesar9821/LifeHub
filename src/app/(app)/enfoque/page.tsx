import { todayStr } from '@/lib/format';
import { durationLabel } from '@/lib/planning/dates';
import { isForToday } from '@/lib/planning/tasks';
import { loadTasks } from '@/services/tasks';
import { loadFocusSummary, WELLBEING_SQL_MISSING } from '@/services/wellbeing';
import { Card, PageHeader } from '@/components/ui/card';
import { FocusTimer, type FocusTask } from '@/components/wellbeing/focus-timer';

export const dynamic = 'force-dynamic';

/** Modo enfoque: una sola cosa, con tiempo, sin distracciones. */
export default async function EnfoquePage({ searchParams }: { searchParams: Promise<{ tarea?: string }> }) {
  const { tarea } = await searchParams;
  const today = todayStr();
  const [{ tasks }, summary] = await Promise.all([loadTasks(), loadFocusSummary()]);
  const open = tasks.filter((t) => t.status !== 'completado' && t.status !== 'inbox');
  // Primero lo de hoy, luego el resto.
  open.sort((a, b) => Number(isForToday(b, today)) - Number(isForToday(a, today)));
  const options: FocusTask[] = open.slice(0, 40).map((t) => ({ id: t.id, title: t.title, area: t.area }));
  const initial = tarea && options.some((o) => o.id === tarea) ? tarea : null;

  return (
    <div className="max-w-md mx-auto space-y-5">
      <PageHeader title="Enfoque" subtitle="Una cosa a la vez. Cuando suene, descansa 5 minutos." />
      {!summary.ready && <p className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm text-ink-2">{WELLBEING_SQL_MISSING}</p>}
      <Card>
        <FocusTimer tasks={options} initialTaskId={initial} />
      </Card>
      {summary.ready && (summary.todayMinutes > 0 || summary.weekMinutes > 0) && (
        <p className="text-center text-sm text-ink-2 tabular-nums">
          Hoy: {summary.todayMinutes > 0 ? durationLabel(summary.todayMinutes) : '0 min'} · Últimos 7 días: {durationLabel(summary.weekMinutes)}
        </p>
      )}
    </div>
  );
}
