'use client';

import { useActionState, useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { saveWeekGoals, toggleObjective } from '@/app/(app)/semana/actions';
import { IDLE_STATE } from '@/lib/action';
import { cn } from '@/lib/utils';
import type { WeeklyObjective } from '@/services/planning';
import { Sheet } from '@/components/ui/sheet';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { CheckButton } from '@/components/ui/check-button';
import { withSuccessToast } from '@/components/ui/toast';
import { BlockForm, AREA_CHOICES, type BlockInitial } from './block-form';
import { AreaDot } from './area';

/** Botón que abre el formulario de bloque/evento con el día ya puesto. */
export function AddBlockButton({
  initial,
  label = 'Agregar bloque',
  className,
}: {
  initial: BlockInitial;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl border border-dashed border-line-strong text-sm font-medium text-ink-2 hover:text-ink hover:border-accent/50',
          className
        )}
      >
        <Plus size={16} /> {label}
      </button>
      <Sheet open={open} onClose={close} title={initial.kind === 'event' ? 'Nuevo evento' : 'Nuevo bloque de tiempo'}>
        <p className="-mt-2 mb-4 text-sm text-ink-3">Un bloque ocupa tiempo en tu agenda. Para algo que hay que hacer, usa una tarea.</p>
        <BlockForm initial={initial} onDone={close} />
      </Sheet>
    </>
  );
}

/** Objetivos de la semana (máximo 3) con check. */
export function ObjectivesList({ weekStart, objectives }: { weekStart: string; objectives: WeeklyObjective[] }) {
  if (objectives.length === 0) return null;
  return (
    <ul className="space-y-0.5">
      {objectives.map((o) => (
        <li key={o.id} className="flex items-center gap-3 min-h-11">
          <form action={toggleObjective}>
            <input type="hidden" name="week_start" value={weekStart} />
            <input type="hidden" name="objective_id" value={o.id} />
            <CheckButton done={o.done} label={o.title} />
          </form>
          <span className={cn('flex-1 min-w-0 text-[15px]', o.done ? 'text-ink-3 line-through' : 'text-ink')}>{o.title}</span>
          <AreaDot area={o.area} />
        </li>
      ))}
    </ul>
  );
}

/** Foco + hasta 3 objetivos de la semana. */
export function WeekGoalsForm({
  weekStart,
  focus,
  objectives,
  onDone,
}: {
  weekStart: string;
  focus: string | null;
  objectives: WeeklyObjective[];
  onDone?: () => void;
}) {
  const [state, formAction] = useActionState(withSuccessToast(saveWeekGoals), IDLE_STATE);
  useEffect(() => {
    if (state.ok) {
      onDone?.();
    }
  }, [state, onDone]);
  const slots = [0, 1, 2].map((i) => objectives[i] ?? null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="week_start" value={weekStart} />
      <Field label="Prioridad principal de la semana" htmlFor="week-focus">
        <Input id="week-focus" name="focus" defaultValue={focus ?? ''} placeholder="Ej: Dejar organizada la logística" />
      </Field>
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-2 px-1">Hasta 3 objetivos (lo que quieres lograr, no tareas)</p>
        {slots.map((o, i) => (
          <div key={i} className="flex gap-2">
            <input type="hidden" name="objective_id" value={o?.id ?? ''} />
            <input type="hidden" name="objective_done" value={String(o?.done ?? false)} />
            <label htmlFor={`obj-${i}`} className="sr-only">
              Objetivo {i + 1}
            </label>
            <Input id={`obj-${i}`} name="objective" defaultValue={o?.title ?? ''} placeholder={`Objetivo ${i + 1}`} className="flex-1" />
            <label htmlFor={`obj-area-${i}`} className="sr-only">
              Área del objetivo {i + 1}
            </label>
            <Select id={`obj-area-${i}`} name="objective_area" defaultValue={o?.area ?? ''} className="w-32 shrink-0">
              <option value="">Área</option>
              {AREA_CHOICES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </Select>
          </div>
        ))}
      </div>
      <InlineMessage state={state.ok ? undefined : state} />
      <SubmitButton pendingText="Guardando…" className="w-full min-h-12">
        Guardar
      </SubmitButton>
    </form>
  );
}

/** Botón "Editar objetivos" que abre el formulario en una hoja. */
export function EditGoalsButton(props: { weekStart: string; focus: string | null; objectives: WeeklyObjective[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center min-h-11 px-1 text-sm font-medium text-accent">
        {props.label ?? 'Editar'}
      </button>
      <Sheet open={open} onClose={close} title="Objetivos de la semana">
        <WeekGoalsForm weekStart={props.weekStart} focus={props.focus} objectives={props.objectives} onDone={close} />
      </Sheet>
    </>
  );
}
