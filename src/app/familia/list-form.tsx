'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { addShoppingList } from './actions';
import { IDLE_STATE } from '@/lib/action';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { InlineMessage } from '@/components/ui/inline-message';

export default function ListForm() {
  const [state, formAction] = useActionState(addShoppingList, IDLE_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-5 md:p-6 backdrop-blur-xl space-y-3"
    >
      <InlineMessage state={state} />
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <Field label="Nueva lista" error={state.fieldErrors?.name} className="flex-1">
          <Input name="name" required placeholder="Ej: Farmacia, Ferretería…" invalid={!!state.fieldErrors?.name} />
        </Field>
        <Field label="Se reinicia" className="sm:w-44">
          <Select name="reset_period" defaultValue="none">
            <option value="none" className="bg-[#0A0C10]">No se reinicia</option>
            <option value="weekly" className="bg-[#0A0C10]">Cada semana</option>
            <option value="monthly" className="bg-[#0A0C10]">Cada mes</option>
          </Select>
        </Field>
        <SubmitButton pendingText="Creando…">
          <Plus size={15} /> Crear lista
        </SubmitButton>
      </div>
    </form>
  );
}
