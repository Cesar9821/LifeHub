'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { addSaving } from './actions';
import { IDLE_STATE } from '@/lib/action';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { CLPInput } from '@/components/ui/clp-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { InlineMessage } from '@/components/ui/inline-message';

/** Nuevo ahorro: nombre y monto objetivo. */
export default function SavingForm() {
  const [state, formAction] = useActionState(addSaving, IDLE_STATE);
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      // CLPInput guarda su propio estado: se reinicia montándolo de nuevo.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormKey((k) => k + 1);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <InlineMessage state={state} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nombre" htmlFor="saving-name" error={state.fieldErrors?.name}>
          <Input id="saving-name" name="name" required defaultValue={state.values?.name ?? ''} placeholder="Ej: Fondo de emergencia" />
        </Field>
        <Field label="Meta (CLP)" htmlFor="saving-target" error={state.fieldErrors?.target_amount}>
          <CLPInput key={formKey} id="saving-target" name="target_amount" required placeholder="1.000.000" />
        </Field>
      </div>
      <SubmitButton pendingText="Creando…" className="w-full sm:w-auto min-h-12">
        <Plus size={18} /> Crear ahorro
      </SubmitButton>
    </form>
  );
}
