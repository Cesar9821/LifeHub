import Link from 'next/link';
import { Inbox, Lightbulb, ListTodo } from 'lucide-react';
import { todayStr } from '@/lib/format';
import { cn } from '@/lib/utils';
import { weekStartOf } from '@/lib/planning/dates';
import { isForToday, isInWeek } from '@/lib/planning/tasks';
import { loadTasks, type Task } from '@/services/tasks';
import { PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { QuickCapture } from '@/components/planning/quick-capture';
import { PlanningSetupCard } from '@/components/planning/setup-card';
import { TaskRow } from '@/components/planning/task-row';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'bandeja', label: 'Sin ordenar' },
  { key: 'ideas', label: 'Ideas' },
  { key: 'todas', label: 'Todas mis tareas' },
] as const;

function Group({ title, tasks, today }: { title: string; tasks: Task[]; today: string }) {
  if (tasks.length === 0) return null;
  return (
    <section className="space-y-1">
      <h2 className="text-sm font-medium text-ink-3 px-1">
        {title} · {tasks.length}
      </h2>
      <ul className="bg-surface border border-line rounded-3xl px-3 divide-y divide-line">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} today={today} variant={t.area === 'trabajo' ? 'work' : 'default'} />
        ))}
      </ul>
    </section>
  );
}

/**
 * 📥 Capturas: lo que se anotó al pasar. Se ordena en un toque (Hoy, Esta
 * semana, Más adelante, Delegar) para sacarlo de la cabeza.
 */
export default async function CapturasPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver } = await searchParams;
  const tab = TABS.some((t) => t.key === ver) ? ver! : 'bandeja';
  const today = todayStr();
  const weekStart = weekStartOf(today);
  const { ready, tasks } = await loadTasks();

  const inbox = tasks.filter((t) => t.status === 'inbox' && t.kind !== 'idea');
  const ideas = tasks.filter((t) => t.kind === 'idea' && t.status === 'inbox');
  const open = tasks.filter((t) => t.status !== 'inbox' && t.status !== 'completado');

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PageHeader title="Capturas" subtitle="Anota sin pensar. Ordena cuando tengas un minuto." />
      {!ready && <PlanningSetupCard />}

      {ready && <QuickCapture />}

      <nav aria-label="Vistas" className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
        {TABS.map((t) => {
          const count = t.key === 'bandeja' ? inbox.length : t.key === 'ideas' ? ideas.length : open.length;
          const active = tab === t.key;
          return (
            <Link
              key={t.key}
              href={t.key === 'bandeja' ? '/capturas' : `/capturas?ver=${t.key}`}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-2 min-h-11 px-4 rounded-full text-sm font-medium whitespace-nowrap border',
                active ? 'bg-ink text-bg border-ink' : 'bg-surface border-line text-ink-2 hover:text-ink'
              )}
            >
              {t.label}
              {count > 0 && <span className={cn('tabular-nums', active ? 'text-bg/70' : 'text-ink-3')}>{count}</span>}
            </Link>
          );
        })}
      </nav>

      {tab === 'bandeja' &&
        (inbox.length === 0 ? (
          <EmptyState icon={<Inbox size={28} />} title="Bandeja vacía" text="Tu cabeza está más liviana. Usa el botón + cuando algo aparezca." />
        ) : (
          <ul className="bg-surface border border-line rounded-3xl px-3 divide-y divide-line">
            {inbox.map((t) => (
              <TaskRow key={t.id} task={t} today={today} variant="inbox" />
            ))}
          </ul>
        ))}

      {tab === 'ideas' &&
        (ideas.length === 0 ? (
          <EmptyState icon={<Lightbulb size={28} />} title="Sin ideas guardadas" text="Cuando se te ocurra algo, guárdalo con + → Idea." />
        ) : (
          <ul className="bg-surface border border-line rounded-3xl px-3 divide-y divide-line">
            {ideas.map((t) => (
              <TaskRow key={t.id} task={t} today={today} variant="inbox" />
            ))}
          </ul>
        ))}

      {tab === 'todas' &&
        (open.length === 0 ? (
          <EmptyState icon={<ListTodo size={28} />} title="Sin tareas abiertas" text="Tu lista está limpia." />
        ) : (
          <div className="space-y-5">
            <Group title="Hoy" tasks={open.filter((t) => isForToday(t, today))} today={today} />
            <Group
              title="Esta semana"
              tasks={open.filter((t) => !isForToday(t, today) && t.status !== 'esperando' && isInWeek(t, weekStart))}
              today={today}
            />
            <Group title="Esperando" tasks={open.filter((t) => t.status === 'esperando')} today={today} />
            <Group
              title="Más adelante"
              tasks={open.filter((t) => !isForToday(t, today) && t.status !== 'esperando' && !isInWeek(t, weekStart))}
              today={today}
            />
          </div>
        ))}
    </div>
  );
}
