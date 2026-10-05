import { getFirstName } from '@/lib/auth';
import { todayStr } from '@/lib/format';
import { unstable_rethrow } from 'next/navigation';
import { nowTimeChile, weekStartOf } from '@/lib/planning/dates';
import { loadFrog, loadPriorities, loadTasks } from '@/services/tasks';
import { loadAgenda, loadWeeklyPlan } from '@/services/planning';
import { loadHabitsToday } from '@/services/habits';
import { loadFinanceSnapshot } from '@/services/finance-snapshot';
import { loadFamilyDates, loadVision, loadWellbeingToday } from '@/services/wellbeing';
import { RefreshOnFocus } from '@/components/planning/refresh-on-focus';
import { HoyView } from './hoy-view';

export const dynamic = 'force-dynamic';

/** Una sección que falla no debe tumbar la pantalla de inicio. */
async function safe<T>(p: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await p;
  } catch (e) {
    unstable_rethrow(e); // redirecciones (sesión vencida) siguen su curso
    console.error(`Hoy · ${label}:`, e);
    return fallback;
  }
}

/**
 * HOY: el centro de comando. En pocos segundos: qué es lo importante, cómo
 * viene el día, qué toca en el trabajo, hábitos y cómo va la plata.
 */
export default async function HoyPage() {
  const today = todayStr();
  const now = nowTimeChile();

  const [name, tasksData, priorities, frog, agenda, habits, finance, weekPlan, wellbeing, dates, vision] = await Promise.all([
    safe(getFirstName(), '', 'nombre'),
    safe(loadTasks(), { ready: false, tasks: [] }, 'tareas'),
    safe(loadPriorities(today), [], 'prioridades'),
    safe(loadFrog(today), null, 'rana'),
    safe(loadAgenda(today, today), { ready: false, items: [] }, 'agenda'),
    safe(loadHabitsToday(), { habits: [], dueCount: 0, doneCount: 0 }, 'hábitos'),
    safe(loadFinanceSnapshot(), null, 'finanzas'),
    safe(loadWeeklyPlan(weekStartOf(today)), null, 'plan semanal'),
    safe(loadWellbeingToday(), null, 'bienestar'),
    safe(loadFamilyDates(14), { ready: false, upcoming: [] }, 'fechas'),
    safe(loadVision(), { ready: false, items: [] }, 'visión'),
  ]);

  return (
    <>
      <RefreshOnFocus />
      <HoyView
        today={today}
        now={now}
        name={name}
        ready={tasksData.ready && agenda.ready}
        tasks={tasksData.tasks}
        priorities={priorities}
        frog={frog}
        agenda={agenda.items}
        habits={habits}
        finance={finance}
        weekPlan={weekPlan}
        wellbeing={wellbeing}
        dates={dates.upcoming}
        vision={vision.items}
      />
    </>
  );
}
