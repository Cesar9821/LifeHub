'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { addCategory } from './actions';
import { IDLE_STATE } from '@/lib/action';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { InlineMessage } from '@/components/ui/inline-message';

export default function CategoryForm() {
  const [state, formAction] = useActionState(addCategory, IDLE_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl space-y-4"
    >
      <InlineMessage state={state} />
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end">
        <Field label="Nombre de la categoría" error={state.fieldErrors?.name}>
          <Input name="name" required placeholder="Ej: Mascotas, Gimnasio…" invalid={!!state.fieldErrors?.name} />
        </Field>
        <Field label="Tipo">
          <Select name="kind" defaultValue="expense">
            <option value="expense" className="bg-[#0A0C10]">Gasto</option>
            <option value="income" className="bg-[#0A0C10]">Ingreso</option>
          </Select>
        </Field>
        <SubmitButton pendingText="Agregando…">
          <Plus size={16} /> Agregar
        </SubmitButton>
      </div>
    </form>
  );
}
