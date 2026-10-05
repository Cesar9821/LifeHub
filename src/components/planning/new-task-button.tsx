'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { saveTask } from '@/app/(app)/tareas/actions';
import { IDLE_STATE } from '@/lib/action';
import { Sheet } from '@/components/ui/sheet';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { toast } from '@/components/ui/toast';
import { TaskForm, type ProjectOption } from './task-form';
import type { TaskView } from './task-row';

type Defaults = Partial<Pick<TaskView, 'area' | 'status' | 'project_id' | 'category'>>;

/** Botón "Nueva tarea" con el formulario completo en una hoja. */
export function NewTaskButton({ defaults, projects, label = 'Nueva tarea' }: { defaults?: Defaults; projects?: ProjectOption[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-ink text-bg text-sm font-semibold hover:bg-white"
      >
        <Plus size={16} /> {label}
      </button>
      <Sheet open={open} onClose={close} title={label}>
        <TaskForm defaults={defaults} projects={projects} onDone={close} />
      </Sheet>
    </>
  );
}

/** Agregar una tarea escribiendo solo el nombre (el resto se completa después). */
export function QuickAddTask({ defaults, placeholder }: { defaults: Defaults; placeholder: string }) {
  const [state, formAction] = useActionState(saveTask, IDLE_STATE);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? 'Agregada.');
      ref.current?.reset();
    }
  }, [state]);
  return (
    <form ref={ref} action={formAction} className="space-y-2">
      {defaults.area && <input type="hidden" name="area" value={defaults.area} />}
      {defaults.category && <input type="hidden" name="category" value={defaults.category} />}
      {defaults.project_id && <input type="hidden" name="project_id" value={defaults.project_id} />}
      <input type="hidden" name="status" value={defaults.status ?? 'pendiente'} />
      <div className="flex gap-2">
        <label htmlFor="quick-task" className="sr-only">
          Nueva tarea
        </label>
        <input
          id="quick-task"
          name="title"
          required
          autoComplete="off"
          maxLength={300}
          placeholder={placeholder}
          className="flex-1 min-w-0 min-h-12 bg-surface-2 border border-line-strong rounded-2xl px-4 text-[15px] text-ink placeholder:text-ink-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
        />
        <SubmitButton aria-label="Agregar tarea" className="min-h-12 w-12 px-0 shrink-0 rounded-2xl">
          <Plus size={20} />
        </SubmitButton>
      </div>
      {!state.ok && <InlineMessage state={state} />}
    </form>
  );
}
