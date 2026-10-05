'use client';

import { useActionState, useCallback, useEffect, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { saveProject } from '@/app/(app)/proyectos/actions';
import { IDLE_STATE } from '@/lib/action';
import type { Project } from '@/services/projects';
import { Sheet } from '@/components/ui/sheet';
import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { toast } from '@/components/ui/toast';
import { ChoiceChips } from './chips';

const STATUS = [
  { value: 'idea', label: 'Idea' },
  { value: 'preparacion', label: 'En preparación' },
  { value: 'activo', label: 'Activo' },
  { value: 'pausado', label: 'En pausa' },
  { value: 'terminado', label: 'Terminado' },
] as const;
const PRIORITY = [
  { value: 'alta', label: 'Alta' },
  { value: 'normal', label: 'Normal' },
  { value: 'baja', label: 'Baja' },
] as const;

export interface ProjectPreset {
  name?: string;
  status?: Project['status'];
  priority?: Project['priority'];
  next_action?: string;
  weekly_minutes?: number;
}

export function ProjectForm({ project, preset, onDone }: { project?: Project; preset?: ProjectPreset; onDone?: () => void }) {
  const [state, formAction] = useActionState(saveProject, IDLE_STATE);
  const [status, setStatus] = useState<string>(project?.status ?? preset?.status ?? 'activo');
  const [priority, setPriority] = useState<string>(project?.priority ?? preset?.priority ?? 'normal');
  const err = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? 'Guardado.');
      onDone?.();
    }
  }, [state, onDone]);
  const minutes = project?.weekly_minutes ?? preset?.weekly_minutes ?? 0;

  return (
    <form action={formAction} className="space-y-4">
      {project && <input type="hidden" name="id" value={project.id} />}
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="priority" value={priority} />
      <Field label="Nombre" htmlFor="project-name" error={err.name}>
        <Input id="project-name" name="name" required defaultValue={project?.name ?? preset?.name ?? ''} placeholder="Ej: InnVolt" />
      </Field>
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-2 px-1">Estado</p>
        <ChoiceChips label="Estado" value={status} onChange={setStatus} options={[...STATUS]} />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-2 px-1">Prioridad ahora</p>
        <ChoiceChips label="Prioridad" value={priority} onChange={setPriority} options={[...PRIORITY]} />
      </div>
      <Field label="Próxima acción" htmlFor="project-next" hint="Un paso concreto y chico.">
        <Input id="project-next" name="next_action" defaultValue={project?.next_action ?? preset?.next_action ?? ''} placeholder="Ej: Revisar documentación" />
      </Field>
      <Field label="Tiempo reservado por semana (horas)" htmlFor="project-hours" hint="Ej: 1 o 1,5. Sin alarmas si no se cumple.">
        <NumberInput id="project-hours" name="weekly_hours" decimals={1} suffix="h" defaultValue={minutes ? minutes / 60 : ''} placeholder="0" />
      </Field>
      <Field label="Notas (opcional)" htmlFor="project-notes">
        <Textarea id="project-notes" name="notes" rows={3} defaultValue={project?.notes ?? ''} />
      </Field>
      <label className="flex items-center justify-between gap-4 min-h-11 px-1 cursor-pointer">
        <span className="text-[15px] text-ink">Compartir con el hogar</span>
        <input type="checkbox" name="shared" defaultChecked={project?.visibility === 'household'} className="h-5 w-5 accent-[var(--color-accent)]" />
      </label>
      <InlineMessage state={state.ok ? undefined : state} />
      <SubmitButton pendingText="Guardando…" className="w-full min-h-12">
        {project ? 'Guardar' : 'Crear proyecto'}
      </SubmitButton>
    </form>
  );
}

export function ProjectFormButton({ project, preset, label }: { project?: Project; preset?: ProjectPreset; label?: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          project
            ? 'inline-flex items-center gap-2 min-h-11 px-4 rounded-xl border border-line-strong text-sm font-medium text-ink-2 hover:text-ink'
            : 'inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-ink text-bg text-sm font-semibold hover:bg-white'
        }
      >
        {project ? <Pencil size={16} /> : <Plus size={16} />} {label ?? (project ? 'Editar' : 'Nuevo proyecto')}
      </button>
      <Sheet open={open} onClose={close} title={project ? 'Editar proyecto' : 'Nuevo proyecto'}>
        <ProjectForm project={project} preset={preset} onDone={close} />
      </Sheet>
    </>
  );
}
