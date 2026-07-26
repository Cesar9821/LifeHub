'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { addGoal } from './actions';
import { IDLE_STATE } from '@/lib/action';
import { GOAL_CATEGORIES } from '@/lib/constants';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { InlineMessage } from '@/components/ui/inline-message';

export default function GoalForm() {
  const [state, formAction] = useActionState(addGoal, IDLE_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  // Al crear con éxito, limpia el formulario.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl space-y-5"
    >
      <div className="flex items-center gap-2">
        <Plus size={18} className="text-amber-400" />
        <h2 className="text-lg font-black text-white uppercase tracking-wider">Nueva meta</h2>
      </div>

      <InlineMessage state={state} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Objetivo" error={state.fieldErrors?.title} className="md:col-span-2">
          <Input
            name="title"
            required
            placeholder="Ej: Correr una maratón, Ahorrar para un viaje…"
            invalid={!!state.fieldErrors?.title}
          />
        </Field>
        <Field label="Detalle (opcional)" className="md:col-span-2">
          <Input name="description" placeholder="Por qué importa, cómo lo medirás…" />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <Field label="Categoría">
          <Select name="category" defaultValue="Personal">
            {GOAL_CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[#0A0C10]">{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Fecha límite (opcional)" error={state.fieldErrors?.target_date}>
          <Input name="target_date" type="date" invalid={!!state.fieldErrors?.target_date} />
        </Field>
        <SubmitButton pendingText="Creando…">
          <Plus size={15} /> Crear meta
        </SubmitButton>
      </div>
    </form>
  );
}
