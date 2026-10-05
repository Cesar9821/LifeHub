import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { groupWorkTasks, WORK_CATEGORIES } from '@/lib/planning/tasks';
import type { Task } from '@/services/tasks';
import { PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PlanningSetupCard } from '@/components/planning/setup-card';
import { TaskRow } from '@/components/planning/task-row';
import type { ProjectOption } from '@/components/planning/task-form';
import { NewTaskButton, QuickAddTask } from '@/components/planning/new-task-button';

export interface TrabajoData {
  today: string;
  ready: boolean;
  tasks: Task[];
  category: string | null;
  projects: ProjectOption[];
}

function Section({
  title,
  hint,
  tasks,
  today,
  projects,
}: {
  title: string;
  hint?: string;
  tasks: Task[];
  today: string;
  projects: ProjectOption[];
}) {
  if (tasks.length === 0) return null;
  return (
    <section className="space-y-1.5" aria-label={title}>
      <div className="px-1">
        <h2 className="text-[16px] font-semibold text-ink">
          {title} <span className="text-ink-3 font-normal tabular-nums">· {tasks.length}</span>
        </h2>
        {hint && <p className="text-sm text-ink-3">{hint}</p>}
      </div>
      <ul className="bg-surface border border-line rounded-3xl px-3 divide-y divide-line">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} today={today} variant="work" projects={projects} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Trabajo · Inmade: lo personal de mi responsabilidad en operación y
 * logística. No es un ERP: Hoy, lo que espera a otros y lo pendiente.
 */
export function TrabajoView({ today, ready, tasks, category, projects }: TrabajoData) {
  const work = tasks.filter((t) => t.area === 'trabajo');
  const filtered = category ? work.filter((t) => t.category === category) : work;
  const g = groupWorkTasks(filtered, today);
  const counts = new Map<string, number>();
  for (const t of work) if (t.status !== 'completado' && t.category) counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
  const openCount = work.filter((t) => t.status !== 'completado').length;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader title="Trabajo" eyebrow="Inmade · operación y logística">
        {ready && <NewTaskButton defaults={{ area: 'trabajo' }} projects={projects} />}
      </PageHeader>
      {!ready && <PlanningSetupCard />}

      {ready && <QuickAddTask defaults={{ area: 'trabajo', category: category ?? undefined }} placeholder="Ej: Confirmar instalación con el cliente" />}

      {openCount > 0 && (
        <nav aria-label="Categorías" className="-mx-4 px-4 overflow-x-auto no-scrollbar">
          <ul className="flex gap-1.5 w-max">
            {[{ value: '', label: 'Todas' }, ...WORK_CATEGORIES].map((c) => {
              const active = (category ?? '') === c.value;
              const n = c.value ? counts.get(c.value) ?? 0 : openCount;
              if (c.value && n === 0 && !active) return null;
              return (
                <li key={c.value || 'todas'}>
                  <Link
                    href={c.value ? `/trabajo?cat=${c.value}` : '/trabajo'}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex items-center gap-1.5 min-h-11 px-4 rounded-full text-sm font-medium whitespace-nowrap border',
                      active ? 'bg-ink text-bg border-ink' : 'bg-surface border-line text-ink-2 hover:text-ink'
                    )}
                  >
                    {c.label}
                    <span className={cn('tabular-nums', active ? 'text-bg/70' : 'text-ink-3')}>{n}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {ready && filtered.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={28} />}
          title={category ? 'Nada en esta categoría' : 'Tu trabajo está al día'}
          text="Anota lo que vaya apareciendo. Si depende de otra persona, márcalo como Esperando."
        />
      ) : (
        <div className="space-y-6">
          <Section
            title="Hoy"
            hint={g.hoy.length > 5 ? 'Es harto para un día. Elige lo más importante y deja espacio para imprevistos.' : undefined}
            tasks={g.hoy}
            today={today}
            projects={projects}
          />
          <Section title="📌 Esperando" hint="Depende de otra persona. Revísalo y haz seguimiento." tasks={g.esperando} today={today} projects={projects} />
          <Section title="Pendientes" tasks={g.pendientes} today={today} projects={projects} />
          {g.completadas.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer list-none min-h-11 inline-flex items-center px-1 text-sm font-medium text-ink-2 hover:text-ink">
                Completadas esta semana · {g.completadas.length}
              </summary>
              <ul className="mt-1 bg-surface border border-line rounded-3xl px-3 divide-y divide-line">
                {g.completadas.map((t) => (
                  <TaskRow key={t.id} task={t} today={today} variant="work" projects={projects} />
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
