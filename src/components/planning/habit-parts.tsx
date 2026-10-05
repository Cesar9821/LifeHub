'use client';

import { useActionState, useCallback, useEffect, useState } from 'react';
import { Pause, Pencil, Plus, Trash2 } from 'lucide-react';
import { deleteHabit, saveSimpleHabit, toggleHabitActive } from '@/app/(app)/mindset/actions';
import { IDLE_STATE } from '@/lib/action';
import { cn } from '@/lib/utils';
import { DAY_LETTERS } from '@/lib/planning/dates';
import { Sheet } from '@/components/ui/sheet';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { toast } from '@/components/ui/toast';
import { ChoiceChips } from './chips';

export interface HabitEditable {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  target_per_week: number;
  days_of_week: number[] | null;
  is_active: boolean;
}

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function HabitForm({ habit, onDone }: { habit?: HabitEditable; onDone: () => void }) {
  const [state, formAction] = useActionState(saveSimpleHabit, IDLE_STATE);
  const initialMode = habit?.days_of_week?.length ? 'days' : habit?.frequency === 'weekly' ? 'weekly' : 'daily';
  const [mode, setMode] = useState<'daily' | 'days' | 'weekly' | ''>(initialMode);
  const [days, setDays] = useState<number[]>(habit?.days_of_week ?? []);
  const [target, setTarget] = useState<string>(String(habit?.frequency === 'weekly' ? habit.target_per_week : 3));
  const err = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? 'Guardado.');
      onDone();
    }
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      {habit && <input type="hidden" name="id" value={habit.id} />}
      <input type="hidden" name="mode" value={mode || 'daily'} />
      {mode === 'weekly' && <input type="hidden" name="target_per_week" value={target} />}
      {mode === 'days' && days.map((d) => <input key={d} type="hidden" name="days" value={d} />)}

      <Field label="Hábito" htmlFor="habit-name" error={err.name}>
        <Input id="habit-name" name="name" required defaultValue={habit?.name ?? ''} placeholder="Ej: Oración, Agua, Lectura" />
      </Field>
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-2 px-1">¿Cuándo?</p>
        <ChoiceChips
          label="Frecuencia"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'daily', label: 'Todos los días' },
            { value: 'days', label: 'Días específicos' },
            { value: 'weekly', label: 'Veces por semana' },
          ]}
        />
      </div>
      {mode === 'days' && (
        <div className="space-y-1">
          <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Días">
            {DAY_LETTERS.map((l, i) => {
              const d = i + 1;
              const on = days.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  aria-label={DAY_NAMES[i]}
                  onClick={() => setDays((cur) => (on ? cur.filter((x) => x !== d) : [...cur, d].sort()))}
                  className={cn('min-h-11 rounded-xl border text-sm font-semibold', on ? 'bg-ink text-bg border-ink' : 'bg-surface border-line-strong text-ink-2')}
                >
                  {l}
                </button>
              );
            })}
          </div>
          {err.days && <p className="text-xs font-medium text-danger px-1">{err.days}</p>}
        </div>
      )}
      {mode === 'weekly' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-ink-2 px-1">Veces por semana</p>
          <ChoiceChips
            label="Veces por semana"
            value={target}
            onChange={(v) => setTarget(v || '3')}
            options={['1', '2', '3', '4', '5', '6'].map((n) => ({ value: n, label: n }))}
          />
        </div>
      )}
      <InlineMessage state={state.ok ? undefined : state} />
      <SubmitButton pendingText="Guardando…" className="w-full min-h-12">
        {habit ? 'Guardar' : 'Crear hábito'}
      </SubmitButton>
    </form>
  );
}

export function NewHabitButton() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-ink text-bg text-sm font-semibold hover:bg-white"
      >
        <Plus size={16} /> Nuevo hábito
      </button>
      <Sheet open={open} onClose={close} title="Nuevo hábito">
        <HabitForm onDone={close} />
      </Sheet>
    </>
  );
}

const iconBtn = 'h-11 w-11 inline-flex items-center justify-center rounded-full text-ink-3 hover:text-ink hover:bg-surface-2';

/** Editar, pausar o eliminar un hábito. */
export function HabitActions({ habit }: { habit: HabitEditable }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <div className="flex items-center shrink-0">
      <button type="button" onClick={() => setOpen(true)} className={iconBtn} aria-label={`Editar ${habit.name}`}>
        <Pencil size={16} />
      </button>
      <form action={toggleHabitActive}>
        <input type="hidden" name="id" value={habit.id} />
        <input type="hidden" name="is_active" value={String(habit.is_active)} />
        <button type="submit" className={iconBtn} aria-label={`Pausar ${habit.name}`}>
          <Pause size={16} />
        </button>
      </form>
      <ConfirmAction
        action={deleteHabit}
        fields={{ id: habit.id }}
        title={`¿Eliminar "${habit.name}"?`}
        message="Se borra con todo su historial. Si solo quieres dejarlo un tiempo, mejor pausarlo."
        confirmLabel="Eliminar"
        triggerClassName={iconBtn}
        triggerTitle="Eliminar"
      >
        <Trash2 size={16} />
        <span className="sr-only">Eliminar {habit.name}</span>
      </ConfirmAction>
      <Sheet open={open} onClose={close} title="Editar hábito">
        <HabitForm habit={habit} onDone={close} />
      </Sheet>
    </div>
  );
}
