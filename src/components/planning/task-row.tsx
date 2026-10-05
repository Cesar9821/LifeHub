'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Timer, Trash2, Users } from 'lucide-react';
import { deleteTask, organizeTask, setTaskStatus, toggleTaskDone } from '@/app/(app)/tareas/actions';
import { cn } from '@/lib/utils';
import { shortDayLabel } from '@/lib/planning/dates';
import { categoryLabel, isOverdue, STATUS_LABEL, WORK_STATUSES, type TaskLike } from '@/lib/planning/tasks';
import { CheckButton } from '@/components/ui/check-button';
import { Chip } from '@/components/ui/chip';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { Sheet } from '@/components/ui/sheet';
import { AreaDot } from './area';
import { TaskForm, type ProjectOption } from './task-form';

/** Lo que el cliente necesita de una tarea (serializable). */
export interface TaskView extends TaskLike {
  notes: string | null;
  visibility: 'private' | 'household';
  mine: boolean;
}

function dueText(t: TaskView, today: string): { text: string; tone: 'danger' | 'accent' | 'neutral' } | null {
  if (!t.due_date) return t.planned_week ? { text: 'Esta semana', tone: 'neutral' } : null;
  const time = t.due_time ? ` ${t.due_time}` : '';
  if (isOverdue(t, today)) return { text: `Atrasada · ${shortDayLabel(t.due_date)}`, tone: 'danger' };
  if (t.due_date === today) return { text: `Hoy${time}`, tone: 'accent' };
  return { text: `${shortDayLabel(t.due_date)}${time}`, tone: 'neutral' };
}

const ghostBtn =
  'min-h-11 px-3.5 rounded-xl border border-line-strong text-sm font-medium text-ink-2 hover:text-ink hover:bg-surface-3';

/** Botones para ordenar una captura (Bandeja). */
function OrganizeButtons({ task }: { task: TaskView }) {
  const [delegating, setDelegating] = useState(false);
  if (delegating) {
    return (
      <form action={organizeTask} className="flex gap-2 pt-2">
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="target" value="delegar" />
        <label htmlFor={`who-${task.id}`} className="sr-only">
          ¿A quién se lo pasas?
        </label>
        <input
          id={`who-${task.id}`}
          name="waiting_on"
          autoFocus
          placeholder="¿A quién? Ej: Camila"
          className="flex-1 min-w-0 min-h-11 bg-surface-2 border border-line-strong rounded-xl px-3 text-[15px] text-ink outline-none focus:border-accent"
        />
        <button type="submit" className={cn(ghostBtn, 'bg-surface-3 text-ink')}>
          Listo
        </button>
      </form>
    );
  }
  const go = (target: string, label: string) => (
    <form action={organizeTask}>
      <input type="hidden" name="id" value={task.id} />
      <input type="hidden" name="target" value={target} />
      <button type="submit" className={ghostBtn}>
        {label}
      </button>
    </form>
  );
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {go('hoy', 'Hoy')}
      {go('semana', 'Esta semana')}
      {go('despues', 'Más adelante')}
      <button type="button" onClick={() => setDelegating(true)} className={ghostBtn}>
        Delegar
      </button>
      <ConfirmAction
        action={deleteTask}
        fields={{ id: task.id }}
        title="¿Eliminar esta captura?"
        message={`"${task.title}" se borra definitivamente.`}
        confirmLabel="Eliminar"
        triggerTitle="Eliminar"
        triggerClassName="min-h-11 w-11 inline-flex items-center justify-center rounded-xl border border-line-strong text-ink-3 hover:text-danger"
      >
        <Trash2 size={16} />
        <span className="sr-only">Eliminar</span>
      </ConfirmAction>
    </div>
  );
}

/**
 * Una tarea: marcar en un toque; al tocar el texto se abre para editar,
 * cambiar estado o eliminar. `inbox` muestra los botones para ordenarla.
 */
export function TaskRow({
  task,
  today,
  variant = 'default',
  projects,
  showDate = true,
}: {
  task: TaskView;
  today: string;
  variant?: 'default' | 'work' | 'inbox';
  projects?: ProjectOption[];
  /** false en una agenda que ya agrupa por día: solo se muestra la hora. */
  showDate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const done = task.status === 'completado';
  const due = showDate
    ? dueText(task, today)
    : task.due_time
      ? { text: task.due_time.slice(0, 5), tone: 'neutral' as const }
      : null;
  const cat = categoryLabel(task.category);

  return (
    <li className="py-1">
      <div className="flex items-start gap-3">
        {variant !== 'inbox' ? (
          <form action={toggleTaskDone} className="pt-1.5">
            <input type="hidden" name="id" value={task.id} />
            <input type="hidden" name="done" value={String(done)} />
            <CheckButton done={done} label={task.title} />
          </form>
        ) : (
          <span className="pt-4 pl-2.5 pr-1">
            <AreaDot area={task.area} />
          </span>
        )}
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full text-left min-h-11 py-2"
            aria-label={`Editar: ${task.title}`}
          >
            <span className={cn('block text-[15px] leading-snug', done ? 'text-ink-3 line-through' : 'text-ink')}>
              {task.kind === 'idea' && '💡 '}
              {task.kind === 'reminder' && '🔔 '}
              {task.title}
            </span>
            {(due || cat || task.waiting_on || (variant === 'work' && task.status === 'en_curso') || task.visibility === 'household') && (
              <span className="mt-1 flex flex-wrap items-center gap-1.5">
                {variant === 'work' && task.status === 'en_curso' && <Chip tone="info">En curso</Chip>}
                {due && <Chip tone={due.tone}>{due.text}</Chip>}
                {cat && <Chip>{cat}</Chip>}
                {task.waiting_on && <Chip tone="warning">Esperando: {task.waiting_on}</Chip>}
                {task.visibility === 'household' && (
                  <span className="inline-flex items-center gap-1 text-xs text-ink-3">
                    <Users size={12} /> Hogar
                  </span>
                )}
              </span>
            )}
          </button>
          {variant === 'inbox' && <OrganizeButtons task={task} />}
        </div>
        {variant === 'default' && (
          <span className="pt-4">
            <AreaDot area={task.area} />
          </span>
        )}
      </div>

      <Sheet open={open} onClose={close} title="Tarea">
        {variant === 'work' && !done && (
          <div className="mb-5 space-y-2">
            <p className="text-xs font-medium text-ink-2 px-1">Cambiar estado</p>
            <div className="flex flex-wrap gap-2">
              {WORK_STATUSES.filter((s) => s !== task.status).map((s) => (
                <form key={s} action={setTaskStatus} onSubmit={() => setTimeout(close, 50)}>
                  <input type="hidden" name="id" value={task.id} />
                  <input type="hidden" name="status" value={s} />
                  <button type="submit" className={ghostBtn}>
                    {STATUS_LABEL[s]}
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}
        {!done && (
          <Link
            href={`/enfoque?tarea=${task.id}`}
            className="mb-5 w-full inline-flex items-center justify-center gap-2 min-h-11 rounded-xl border border-accent/30 bg-accent/5 text-sm font-semibold text-accent hover:bg-accent/10"
          >
            <Timer size={16} /> Enfocarme en esta tarea
          </Link>
        )}
        <TaskForm task={task} projects={projects} onDone={close} />
        <div className="mt-4 pt-4 border-t border-line">
          <ConfirmAction
            action={deleteTask}
            fields={{ id: task.id }}
            title="¿Eliminar esta tarea?"
            message={`"${task.title}" se borra definitivamente.`}
            confirmLabel="Eliminar"
            triggerClassName="w-full inline-flex items-center justify-center gap-2 min-h-11 rounded-xl border border-line text-sm font-medium text-ink-2 hover:text-danger hover:border-danger/30"
          >
            <Trash2 size={15} /> Eliminar tarea
          </ConfirmAction>
        </div>
      </Sheet>
    </li>
  );
}
