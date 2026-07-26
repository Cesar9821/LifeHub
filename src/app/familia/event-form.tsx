'use client';

import { useActionState, useEffect, useRef } from 'react';
import { CalendarPlus } from 'lucide-react';
import { addEvent } from './actions';
import { IDLE_STATE } from '@/lib/action';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { InlineMessage } from '@/components/ui/inline-message';

export default function EventForm() {
  const [state, formAction] = useActionState(addEvent, IDLE_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <InlineMessage state={state} />
      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <Field label="Evento" error={state.fieldErrors?.title} className="flex-1">
          <Input
            name="title"
            required
            placeholder="Ej: Cumpleaños de mamá, Pago del colegio…"
            invalid={!!state.fieldErrors?.title}
          />
        </Field>
        <Field label="Fecha" error={state.fieldErrors?.event_date} className="md:w-44">
          <Input name="event_date" type="date" required invalid={!!state.fieldErrors?.event_date} />
        </Field>
        <Field label="Hora (opcional)" className="md:w-32">
          <Input name="event_time" type="time" />
        </Field>
        <SubmitButton pendingText="Agregando…">
          <CalendarPlus size={15} /> Agregar
        </SubmitButton>
      </div>
    </form>
  );
}
