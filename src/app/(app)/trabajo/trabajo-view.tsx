import Link from 'next/link';
import { cn } from '@/lib/utils';
import { addDays, dayMonthLabel, dayName, dayShort } from '@/lib/planning/dates';
import { groupWorkAgenda, WORK_CATEGORIES } from '@/lib/planning/tasks';
import type { Task } from '@/services/tasks';
import { PageHeader } from '@/components/ui/card';
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

const listBox = 'bg-surface border border-line rounded-3xl px-3 divide-y divide-line';

function Section({
  title,
  hint,
  tone,
  tasks,
  today,
  projects,
}: {
  title: string;
  hint?: string;
  tone?: 'danger';
  tasks: Task[];
  today: string;
  projects: ProjectOption[];
}) {
  if (tasks.length === 0) return null;
  return (
    <section className="space-y-1.5" aria-label={title}>
      <div className="px-1">
        <h2 className={cn('text-[16px] font-semibold', tone === 'danger' ? 'text-danger' : 'text-ink')}>
          {title} <span className="text-ink-3 font-normal tabular-nums">· {tasks.length}</span>
        </h2>
        {hint && <p className="text-sm text-ink-3">{hint}</p>}
      </div>
      <ul className={listBox}>
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} today={today} variant="work" projects={projects} />
        ))}
      </ul>
    </section>
  );
}

/** Un día de la agenda: la fecha a la izquierda, como en un calendario. */
function AgendaDay({
  date,
  tasks,
  today,
  category,
  projects,
}: {
  date: string;
  tasks: Task[];
  today: string;
  category: string | null;
  projects: ProjectOption[];
}) {
  const isToday = date === today;
  const tomorrow = date === addDays(today, 1);
  const title = isToday ? 'Hoy' : tomorrow ? 'Mañana' : dayName(date);
  const weekend = ['sáb', 'dom'].includes(dayShort(date));
  const addLabel = `Agregar tarea para ${isToday ? 'hoy' : tomorrow ? 'mañana' : `el ${dayName(date).toLowerCase()} ${dayMonthLabel(date)}`}`;

  return (
    <li className="flex gap-3" aria-label={`${title} ${dayMonthLabel(date)}`}>
      <div
        className={cn(
          'w-12 shrink-0 h-14 rounded-2xl flex flex-col items-center justify-center',
          isToday ? 'bg-accent/15 text-accent' : weekend ? 'border border-line text-ink-3' : 'bg-surface border border-line text-ink-2'
        )}
        aria-hidden
      >
        <span className="text-[11px] font-semibold uppercase tracking-wide">{dayShort(date)}</span>
        <span className="text-lg font-semibold leading-none tabular-nums">{Number(date.slice(8, 10))}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-h-14">
          <h2 className="flex-1 min-w-0 truncate">
            <span className="text-[16px] font-semibold text-ink">{title}</span>
            <span className="text-sm text-ink-3"> · {dayMonthLabel(date)}</span>
            {tasks.length === 0 && <span className="text-sm text-ink-3"> · Libre</span>}
          </h2>
          <NewTaskButton
            compact
            label={addLabel}
            defaults={{ area: 'trabajo', due_date: date, category: category ?? undefined }}
            projects={projects}
          />
        </div>
        {tasks.length > 0 && (
          <ul className={listBox}>
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} today={today} variant="work" projects={projects} showDate={false} />
            ))}
          </ul>
        )}
        {isToday && tasks.length > 5 && (
          <p className="mt-1.5 px-1 text-sm text-ink-3">Es harto para un día. Elige lo más importante y deja espacio para imprevistos.</p>
        )}
      </div>
    </li>
  );
}

/**
 * Trabajo · Inmade como agenda: cada tarea en su día, con la semana siempre
 * a la vista. Arriba lo atrasado; abajo lo que espera a otros y lo sin fecha.
 */
export function TrabajoView({ today, ready, tasks, category, projects }: TrabajoData) {
  const work = tasks.filter((t) => t.area === 'trabajo');
  const filtered = category ? work.filter((t) => t.category === category) : work;
  const a = groupWorkAgenda(filtered, today);
  const counts = new Map<string, number>();
  for (const t of work) if (t.status !== 'completado' && t.category) counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
  const openCount = work.filter((t) => t.status !== 'completado').length;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader title="Trabajo" eyebrow="Inmade · operación y logística">
        {ready && <NewTaskButton defaults={{ area: 'trabajo', due_date: today }} projects={projects} />}
      </PageHeader>
      {!ready && <PlanningSetupCard />}

      {ready && (
        <QuickAddTask
          today={today}
          defaults={{ area: 'trabajo', category: category ?? undefined }}
          placeholder="Ej: Confirmar instalación con el cliente"
        />
      )}

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

      {ready && (
        <div className="space-y-6">
          <Section
            title="Atrasadas"
            hint="Ponles un día nuevo o márcalas como hechas."
            tone="danger"
            tasks={a.atrasadas}
            today={today}
            projects={projects}
          />

          <section aria-label="Agenda">
            <ol className="space-y-3">
              {a.dias.map((d) => (
                <AgendaDay key={d.date} date={d.date} tasks={d.tasks} today={today} category={category} projects={projects} />
              ))}
            </ol>
          </section>

          <Section title="📌 Esperando" hint="Depende de otra persona. Revísalo y haz seguimiento." tasks={a.esperando} today={today} projects={projects} />
          <Section title="Sin fecha" hint="Cuando sepas cuándo, dales un día." tasks={a.sinFecha} today={today} projects={projects} />
          {a.completadas.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer list-none min-h-11 inline-flex items-center px-1 text-sm font-medium text-ink-2 hover:text-ink">
                Completadas esta semana · {a.completadas.length}
              </summary>
              <ul className={cn('mt-1', listBox)}>
                {a.completadas.map((t) => (
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
