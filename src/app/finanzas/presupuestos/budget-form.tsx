'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { setBudget } from './actions';
import { IDLE_STATE } from '@/lib/action';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/input';
import { CLPInput } from '@/components/ui/clp-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { InlineMessage } from '@/components/ui/inline-message';

export default function BudgetForm({ categories }: { categories: string[] }) {
  const [state, formAction] = useActionState(setBudget, IDLE_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-7 backdrop-blur-xl space-y-4"
    >
      <InlineMessage state={state} />
      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <Field label="Categoría" error={state.fieldErrors?.category} className="flex-1">
          <Select name="category" defaultValue={categories[0] ?? ''}>
            {categories.map((c) => (
              <option key={c} value={c} className="bg-[#0A0C10]">{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Límite mensual" className="md:w-48">
          <CLPInput name="amount" placeholder="150.000" required accent="emerald" />
        </Field>
        <SubmitButton pendingText="Guardando…" className="bg-emerald-600 text-white hover:bg-emerald-500">
          <Plus size={15} /> Fijar
        </SubmitButton>
      </div>
    </form>
  );
}
