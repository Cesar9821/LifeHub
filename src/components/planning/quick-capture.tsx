'use client';

import { useActionState, useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { captureItem } from '@/app/(app)/tareas/actions';
import { IDLE_STATE } from '@/lib/action';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { toast } from '@/components/ui/toast';

/** "¿Qué tienes en la cabeza?": se guarda en Capturas para ordenarlo después. */
export function QuickCapture() {
  const [state, formAction] = useActionState(captureItem, IDLE_STATE);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? 'Guardado en Capturas.');
      ref.current?.reset();
    }
  }, [state]);
  return (
    <form ref={ref} action={formAction} className="space-y-2">
      <input type="hidden" name="type" value="task" />
      <input type="hidden" name="when" value="inbox" />
      <div className="flex gap-2">
        <label htmlFor="quick-capture" className="sr-only">
          ¿Qué tienes en la cabeza?
        </label>
        <input
          id="quick-capture"
          name="title"
          required
          autoComplete="off"
          maxLength={300}
          placeholder="¿Qué tienes en la cabeza?"
          className="flex-1 min-w-0 min-h-12 bg-surface-2 border border-line-strong rounded-2xl px-4 text-[15px] text-ink placeholder:text-ink-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
        />
        <SubmitButton aria-label="Guardar en Capturas" className="min-h-12 w-12 px-0 shrink-0 rounded-2xl">
          <ArrowUp size={20} />
        </SubmitButton>
      </div>
      {!state.ok && <InlineMessage state={state} />}
    </form>
  );
}
