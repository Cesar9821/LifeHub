'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { addTask } from './actions';
import { IDLE_STATE } from '@/lib/action';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { InlineMessage } from '@/components/ui/inline-message';

export default function TaskForm({
  members,
}: {
  members: { user_id: string; full_name: string }[];
}) {
  const [state, formAction] = useActionState(addTask, IDLE_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <InlineMessage state={state} />
      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <Field label="Nueva tarea" error={state.fieldErrors?.title} className="flex-1">
          <Input
            name="title"
            required
            placeholder="Ej: Sacar la basura, Pagar el gas…"
            invalid={!!state.fieldErrors?.title}
          />
        </Field>
        <Field label="Responsable" className="md:w-44">
          <Select name="assigned_to" defaultValue="">
            <option value="" className="bg-[#0A0C10]">Sin asignar</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id} className="bg-[#0A0C10]">
                {m.full_name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fecha (opcional)" className="md:w-44">
          <Input name="due_date" type="date" />
        </Field>
        <SubmitButton pendingText="Agregando…">
          <Plus size={15} /> Agregar
        </SubmitButton>
      </div>
    </form>
  );
}
