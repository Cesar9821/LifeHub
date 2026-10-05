'use client';

import { useActionState, useEffect, useState } from 'react';
import { saveTask } from '@/app/(app)/tareas/actions';
import { IDLE_STATE } from '@/lib/action';
import { STATUS_LABEL, WORK_CATEGORIES, WORK_STATUSES, type TaskStatus } from '@/lib/planning/tasks';
import { Field } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { withSuccessToast } from '@/components/ui/toast';
import { AREA_CHOICES } from './block-form';
import { ChoiceChips } from './chips';
import type { TaskView } from './task-row';

export interface ProjectOption {
  id: string;
  name: string;
}

/** Crear o editar una tarea. Solo el nombre es obligatorio. */
export function TaskForm({
  task,
  defaults,
  projects = [],
  onDone,
}: {
  task?: TaskView;
  defaults?: Partial<Pick<TaskView, 'area' | 'status' | 'project_id' | 'category'>>;
  projects?: ProjectOption[];
  onDone?: () => void;
}) {
  const [state, formAction] = useActionState(withSuccessToast(saveTask), IDLE_STATE);
  const [area, setArea] = useState<string>(task?.area ?? defaults?.area ?? '');
  const [category, setCategory] = useState<string>(task?.category ?? defaults?.category ?? '');
  const initialStatus = task?.status && task.status !== 'inbox' ? task.status : defaults?.status ?? 'pendiente';
  const [status, setStatus] = useState<TaskStatus | ''>(initialStatus);
  const err = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      onDone?.();
    }
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      {task && <input type="hidden" name="id" value={task.id} />}
      <input type="hidden" name="area" value={area} />
      <input type="hidden" name="category" value={area === 'trabajo' ? category : ''} />
      <input type="hidden" name="status" value={status || 'pendiente'} />

      <Field label="Tarea" htmlFor="task-title" error={err.title}>
        <Input
          id="task-title"
          name="title"
          required
          autoComplete="off"
          maxLength={300}
          defaultValue={state.values?.title ?? task?.title ?? ''}
          placeholder="Ej: Confirmar instalación"
          invalid={!!err.title}
        />
      </Field>

      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-2 px-1">Área</p>
        <ChoiceChips label="Área" value={area} onChange={setArea} allowNone options={AREA_CHOICES} />
      </div>

      {area === 'trabajo' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-ink-2 px-1">Categoría</p>
          <ChoiceChips
            label="Categoría"
            value={category}
            onChange={setCategory}
            allowNone
            options={WORK_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          />
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-2 px-1">Estado</p>
        <ChoiceChips
          label="Estado"
          value={status}
          onChange={setStatus}
          options={WORK_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
        />
      </div>

      {status === 'esperando' && (
        <Field label="¿Esperando a quién o qué?" htmlFor="task-waiting">
          <Input
            id="task-waiting"
            name="waiting_on"
            defaultValue={task?.waiting_on ?? ''}
            placeholder="Ej: Confirmación del proveedor"
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha (opcional)" htmlFor="task-date">
          <Input id="task-date" type="date" name="due_date" defaultValue={task?.due_date ?? ''} />
        </Field>
        <Field label="Hora (opcional)" htmlFor="task-time" hint="Con hora aparece en tu agenda">
          <Input id="task-time" type="time" name="due_time" defaultValue={task?.due_time ?? ''} />
        </Field>
      </div>

      {projects.length > 0 && (
        <Field label="Proyecto (opcional)" htmlFor="task-project">
          <Select id="task-project" name="project_id" defaultValue={task?.project_id ?? defaults?.project_id ?? ''}>
            <option value="">Sin proyecto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {projects.length === 0 && defaults?.project_id && <input type="hidden" name="project_id" value={defaults.project_id} />}

      <Field label="Notas (opcional)" htmlFor="task-notes">
        <Textarea id="task-notes" name="notes" rows={2} defaultValue={task?.notes ?? ''} />
      </Field>

      <label className="flex items-center justify-between gap-4 min-h-11 px-1 cursor-pointer">
        <span>
          <span className="block text-[15px] text-ink">Compartir con el hogar</span>
          <span className="block text-sm text-ink-3">Si no, solo la ves tú</span>
        </span>
        <input
          type="checkbox"
          name="shared"
          defaultChecked={task ? task.visibility === 'household' : area === 'familia'}
          className="h-5 w-5 accent-[var(--color-accent)] shrink-0"
        />
      </label>

      <InlineMessage state={state.ok ? undefined : state} />
      <SubmitButton pendingText="Guardando…" className="w-full min-h-12">
        {task ? 'Guardar cambios' : 'Agregar tarea'}
      </SubmitButton>
    </form>
  );
}
