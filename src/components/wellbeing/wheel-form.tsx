'use client';

import { useActionState, useState } from 'react';
import { saveWheel } from '@/app/(app)/bienestar/actions';
import { IDLE_STATE } from '@/lib/action';
import { WHEEL_AREAS, WHEEL_HINT, WHEEL_LABEL, type Wheel, type WheelArea } from '@/lib/wellbeing';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { withSuccessToast } from '@/components/ui/toast';

/** Nota del 1 al 10 para cada área de tu vida esta semana. */
export function WheelForm({ weekStart, initial }: { weekStart: string; initial: Wheel }) {
  const [state, formAction] = useActionState(withSuccessToast(saveWheel, 'Rueda guardada.'), IDLE_STATE);
  const [values, setValues] = useState<Record<WheelArea, number>>(
    () => Object.fromEntries(WHEEL_AREAS.map((a) => [a, initial[a] ?? 5])) as Record<WheelArea, number>
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="week_start" value={weekStart} />
      {WHEEL_AREAS.map((a) => (
        <div key={a} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <label htmlFor={`wheel-${a}`} className="text-[15px] font-medium text-ink">
              {WHEEL_LABEL[a]}
            </label>
            <span className="text-[15px] font-semibold tabular-nums text-accent" aria-hidden>
              {values[a]}
            </span>
          </div>
          <p className="px-1 text-xs text-ink-3">{WHEEL_HINT[a]}</p>
          <input
            id={`wheel-${a}`}
            name={a}
            type="range"
            min={1}
            max={10}
            step={1}
            value={values[a]}
            onChange={(e) => setValues((v) => ({ ...v, [a]: Number(e.target.value) }))}
            aria-valuetext={`${values[a]} de 10`}
            className="w-full h-11 accent-[var(--color-accent)] cursor-pointer"
          />
        </div>
      ))}
      <InlineMessage state={state.ok ? undefined : state} />
      <SubmitButton pendingText="Guardando…" className="w-full min-h-12">
        Guardar mi rueda
      </SubmitButton>
    </form>
  );
}
