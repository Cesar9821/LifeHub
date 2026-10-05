'use client';

import { useActionState, useEffect, useState } from 'react';
import { saveBlock } from '@/app/(app)/semana/actions';
import { IDLE_STATE } from '@/lib/action';
import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { withSuccessToast } from '@/components/ui/toast';
import { ChoiceChips } from './chips';

export const AREA_CHOICES = [
  { value: 'trabajo', label: 'Trabajo' },
  { value: 'familia', label: 'Familia' },
  { value: 'salud', label: 'Salud' },
  { value: 'personal', label: 'Personal' },
  { value: 'proyectos', label: 'Proyectos' },
  { value: 'habitos', label: 'Hábitos' },
];

export interface BlockInitial {
  id?: string;
  kind?: 'block' | 'event';
  title?: string;
  notes?: string | null;
  area?: string | null;
  date: string;
  start?: string | null;
  end?: string | null;
  shared?: boolean;
  project_id?: string | null;
  task_id?: string | null;
}

/**
 * Bloque de tiempo (algo que OCUPA tiempo) o evento. Pocos campos: nombre,
 * día, horario y área.
 */
export function BlockForm({ initial, onDone }: { initial: BlockInitial; onDone?: () => void }) {
  const [state, formAction] = useActionState(withSuccessToast(saveBlock), IDLE_STATE);
  const [area, setArea] = useState(initial.area ?? '');
  const err = state.fieldErrors ?? {};
  const kind = initial.kind ?? 'block';

  useEffect(() => {
    if (state.ok) {
      onDone?.();
    }
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="area" value={area} />
      {initial.project_id && <input type="hidden" name="project_id" value={initial.project_id} />}
      {initial.task_id && <input type="hidden" name="task_id" value={initial.task_id} />}

      <Field label="¿Qué es?" htmlFor="block-title" error={err.title}>
        <Input
          id="block-title"
          name="title"
          required
          autoComplete="off"
          defaultValue={state.values?.title ?? initial.title ?? ''}
          placeholder={kind === 'event' ? 'Ej: Reunión del colegio' : 'Ej: Tiempo familiar'}
          invalid={!!err.title}
        />
      </Field>
      <Field label="Día" htmlFor="block-date" error={err.date}>
        <Input id="block-date" type="date" name="date" required defaultValue={initial.date} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={kind === 'event' ? 'Desde (opcional)' : 'Desde'} htmlFor="block-start" error={err.start}>
          <Input id="block-start" type="time" name="start" required={kind === 'block'} defaultValue={initial.start ?? ''} />
        </Field>
        <Field label={kind === 'event' ? 'Hasta (opcional)' : 'Hasta'} htmlFor="block-end" error={err.end}>
          <Input id="block-end" type="time" name="end" required={kind === 'block'} defaultValue={initial.end ?? ''} />
        </Field>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-2 px-1">Área</p>
        <ChoiceChips label="Área" value={area} onChange={setArea} allowNone options={AREA_CHOICES} />
      </div>
      <Field label="Nota (opcional)" htmlFor="block-notes">
        <Textarea id="block-notes" name="notes" rows={2} defaultValue={initial.notes ?? ''} />
      </Field>
      <label className="flex items-center justify-between gap-4 min-h-11 px-1 cursor-pointer">
        <span className="text-[15px] text-ink">Compartir con el hogar</span>
        <input type="checkbox" name="shared" defaultChecked={initial.shared} className="h-5 w-5 accent-[var(--color-accent)]" />
      </label>
      <InlineMessage state={state.ok ? undefined : state} />
      <SubmitButton pendingText="Guardando…" className="w-full min-h-12">
        {initial.id ? 'Guardar cambios' : 'Agendar'}
      </SubmitButton>
    </form>
  );
}
