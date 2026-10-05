'use client';

import { useActionState, useEffect, useState } from 'react';
import { saveClosing } from '@/app/(app)/bienestar/actions';
import { IDLE_STATE } from '@/lib/action';
import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { withSuccessToast } from '@/components/ui/toast';
import { ChoiceChips } from '@/components/planning/chips';
import type { Reflection } from '@/services/wellbeing';
import { MOODS } from '@/lib/wellbeing';

/** Tres preguntas cortas para cerrar el día (un minuto). */
export function ClosingForm({ initial, onDone }: { initial?: Reflection | null; onDone?: () => void }) {
  const [state, formAction] = useActionState(withSuccessToast(saveClosing, 'Día cerrado.'), IDLE_STATE);
  const [mood, setMood] = useState<string>(initial?.mood ? String(initial.mood) : '');
  const err = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok) onDone?.();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      {mood && <input type="hidden" name="mood" value={mood} />}
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-2 px-1">¿Cómo estuvo tu día?</p>
        <ChoiceChips
          label="Cómo estuvo tu día"
          value={mood}
          onChange={setMood}
          allowNone
          options={MOODS.map((m) => ({ value: m.value, label: `${m.label} ${m.name}` }))}
        />
      </div>
      <Field label="¿Qué salió bien hoy?" htmlFor="closing-well" error={err.went_well}>
        <Textarea
          id="closing-well"
          name="went_well"
          rows={2}
          maxLength={500}
          defaultValue={state.values?.went_well ?? initial?.went_well ?? ''}
          placeholder="Ej: Terminé la cotización a tiempo"
        />
      </Field>
      <Field label="Hoy agradezco…" htmlFor="closing-grateful" error={err.grateful}>
        <Textarea
          id="closing-grateful"
          name="grateful"
          rows={2}
          maxLength={500}
          defaultValue={state.values?.grateful ?? initial?.grateful ?? ''}
          placeholder="Ej: La once con los niños"
        />
      </Field>
      <Field
        label="¿Qué es lo primero que harás mañana?"
        htmlFor="closing-tomorrow"
        hint="Queda como prioridad de mañana."
        error={err.tomorrow_first}
      >
        <Input
          id="closing-tomorrow"
          name="tomorrow_first"
          maxLength={200}
          autoComplete="off"
          defaultValue={state.values?.tomorrow_first ?? initial?.tomorrow_first ?? ''}
          placeholder="Ej: Llamar al proveedor de paneles"
        />
      </Field>
      <InlineMessage state={state.ok ? undefined : state} />
      <SubmitButton pendingText="Guardando…" className="w-full min-h-12">
        {initial ? 'Guardar cambios' : 'Cerrar el día'}
      </SubmitButton>
    </form>
  );
}
