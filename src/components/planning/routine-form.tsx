'use client';

import { useActionState, useCallback, useEffect, useState } from 'react';
import { Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { deleteRoutine, saveRoutine, toggleRoutineActive } from '@/app/(app)/semana/actions';
import { IDLE_STATE } from '@/lib/action';
import { cn } from '@/lib/utils';
import { DAY_LETTERS } from '@/lib/planning/dates';
import { daysLabel } from '@/lib/planning/recurrence';
import type { Routine } from '@/services/planning';
import { Sheet } from '@/components/ui/sheet';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { toast } from '@/components/ui/toast';
import { AREA_CHOICES } from './block-form';
import { ChoiceChips } from './chips';
import { AreaDot } from './area';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function RoutineForm({ routine, onDone }: { routine?: Routine; onDone?: () => void }) {
  const [state, formAction] = useActionState(saveRoutine, IDLE_STATE);
  const [days, setDays] = useState<number[]>(routine?.days_of_week ?? []);
  const [area, setArea] = useState<string>(routine?.area ?? '');
  const err = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? 'Guardado.');
      onDone?.();
    }
  }, [state, onDone]);

  const toggle = (d: number) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));

  return (
    <form action={formAction} className="space-y-4">
      {routine && <input type="hidden" name="id" value={routine.id} />}
      <input type="hidden" name="area" value={area} />
      {days.map((d) => (
        <input key={d} type="hidden" name="days" value={d} />
      ))}

      <Field label="Nombre" htmlFor="routine-title" error={err.title}>
        <Input id="routine-title" name="title" required defaultValue={routine?.title ?? ''} placeholder="Ej: Gym" />
      </Field>

      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-2 px-1">Días</p>
        <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Días de la semana">
          {DAY_LETTERS.map((l, i) => {
            const d = i + 1;
            const on = days.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                aria-label={DAY_NAMES[i]}
                onClick={() => toggle(d)}
                className={cn(
                  'min-h-11 rounded-xl border text-sm font-semibold',
                  on ? 'bg-ink text-bg border-ink' : 'bg-surface border-line-strong text-ink-2'
                )}
              >
                {l}
              </button>
            );
          })}
        </div>
        {err.days && <p className="text-xs font-medium text-danger px-1">{err.days}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Desde" htmlFor="routine-start" error={err.start}>
          <Input id="routine-start" type="time" name="start" required defaultValue={routine?.start_time ?? ''} />
        </Field>
        <Field label="Hasta" htmlFor="routine-end" error={err.end}>
          <Input id="routine-end" type="time" name="end" required defaultValue={routine?.end_time ?? ''} />
        </Field>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-2 px-1">Área</p>
        <ChoiceChips label="Área" value={area} onChange={setArea} allowNone options={AREA_CHOICES} />
      </div>

      <label className="flex items-center justify-between gap-4 min-h-11 px-1 cursor-pointer">
        <span className="text-[15px] text-ink">Compartir con el hogar</span>
        <input type="checkbox" name="shared" defaultChecked={routine?.visibility === 'household'} className="h-5 w-5 accent-[var(--color-accent)]" />
      </label>

      {routine && <p className="text-sm text-ink-3">El cambio aplica a toda la rutina. Para cambiar un solo día, tócalo en la semana.</p>}
      <InlineMessage state={state.ok ? undefined : state} />
      <SubmitButton pendingText="Guardando…" className="w-full min-h-12">
        {routine ? 'Guardar rutina' : 'Crear rutina'}
      </SubmitButton>
    </form>
  );
}

export function NewRoutineButton() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-ink text-bg text-sm font-semibold hover:bg-white"
      >
        <Plus size={16} /> Nueva rutina
      </button>
      <Sheet open={open} onClose={close} title="Nueva rutina">
        <RoutineForm onDone={close} />
      </Sheet>
    </>
  );
}

const iconBtn = 'h-11 w-11 inline-flex items-center justify-center rounded-full text-ink-3 hover:text-ink hover:bg-surface-2';

export function RoutineRow({ routine }: { routine: Routine }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <li className={cn('flex items-center gap-3 py-2', !routine.active && 'opacity-60')}>
      <AreaDot area={routine.area} />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-ink truncate">{routine.title}</p>
        <p className="text-sm text-ink-3">
          {daysLabel(routine.days_of_week)} · {routine.start_time}–{routine.end_time}
          {!routine.active && ' · En pausa'}
          {routine.valid_until && ` · hasta ${routine.valid_until.split('-').reverse().slice(0, 2).join('/')}`}
        </p>
      </div>
      {routine.mine && (
        <>
          <button type="button" onClick={() => setOpen(true)} className={iconBtn} aria-label={`Editar ${routine.title}`}>
            <Pencil size={16} />
          </button>
          <form action={toggleRoutineActive}>
            <input type="hidden" name="id" value={routine.id} />
            <input type="hidden" name="active" value={String(routine.active)} />
            <button type="submit" className={iconBtn} aria-label={routine.active ? `Pausar ${routine.title}` : `Reactivar ${routine.title}`}>
              {routine.active ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </form>
          <ConfirmAction
            action={deleteRoutine}
            fields={{ id: routine.id }}
            title={`¿Eliminar la rutina "${routine.title}"?`}
            message="Desaparece de todas las semanas, también de las pasadas. Si solo quieres dejarla de lado, mejor pausarla."
            confirmLabel="Eliminar"
            triggerClassName={iconBtn}
            triggerTitle="Eliminar"
          >
            <Trash2 size={16} />
            <span className="sr-only">Eliminar {routine.title}</span>
          </ConfirmAction>
          <Sheet open={open} onClose={close} title="Editar rutina">
            <RoutineForm routine={routine} onDone={close} />
          </Sheet>
        </>
      )}
    </li>
  );
}
