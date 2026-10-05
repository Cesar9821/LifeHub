import { todayStr } from '@/lib/format';
import { WORK_CATEGORIES } from '@/lib/planning/tasks';
import { loadTasks } from '@/services/tasks';
import { loadProjects } from '@/services/projects';
import { TrabajoView } from './trabajo-view';

export const dynamic = 'force-dynamic';

export default async function TrabajoPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const category = WORK_CATEGORIES.some((c) => c.value === cat) ? cat! : null;
  const [{ ready, tasks }, projects] = await Promise.all([loadTasks(), loadProjects()]);
  return (
    <TrabajoView
      today={todayStr()}
      ready={ready}
      tasks={tasks}
      category={category}
      projects={projects.projects.filter((p) => p.status !== 'terminado').map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
