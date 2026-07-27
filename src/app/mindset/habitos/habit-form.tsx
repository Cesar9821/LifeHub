'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { addHabit } from '../actions';
import { IDLE_STATE } from '@/lib/action';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { InlineMessage } from '@/components/ui/inline-message';

export default function HabitForm() {
  const [state, formAction] = useActionState(addHabit, IDLE_STATE);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl space-y-5"
    >
      <InlineMessage state={state} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Hábito" error={state.fieldErrors?.name}>
          <Input
            name="name"
            required
            defaultValue={state.values?.name ?? ''}
            placeholder="Ej: Entrenar, Leer 30 min, Meditar…"
            invalid={!!state.fieldErrors?.name}
          />
        </Field>
        <Field label="Detalle (opcional)">
          <Input name="description" defaultValue={state.values?.description ?? ''} placeholder="Ej: 6:00 AM, sin excusas" />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <Field label="Tipo">
          <Select name="kind" defaultValue="build">
            <option value="build" className="bg-[#0A0C10]">Quiero hacerlo</option>
            <option value="break" className="bg-[#0A0C10]">Quiero evitarlo</option>
          </Select>
        </Field>

        <Field label="Frecuencia">
          <Select
            name="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly')}
          >
            <option value="daily" className="bg-[#0A0C10]">Todos los días</option>
            <option value="weekly" className="bg-[#0A0C10]">Veces por semana</option>
          </Select>
        </Field>

        {frequency === 'weekly' ? (
          <Field label="Veces por semana">
            <Input name="target_per_week" type="number" min="1" max="7" defaultValue={3} />
          </Field>
        ) : (
          <input type="hidden" name="target_per_week" value={7} />
        )}

        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 cursor-pointer pb-3">
          <input name="non_negotiable" type="checkbox" className="w-4 h-4 accent-rose-500" />
          🔒 Innegociable
        </label>
        <SubmitButton pendingText="Creando…" className={frequency === 'weekly' ? 'md:col-span-3' : ''}>
          <Plus size={15} /> Crear hábito
        </SubmitButton>
      </div>
    </form>
  );
}
