'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveReview } from '@/app/(app)/semana/actions';
import { IDLE_STATE } from '@/lib/action';
import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { toast } from '@/components/ui/toast';
import { ChoiceChips } from './chips';

const RATINGS = [
  { value: '1', label: '😞 Difícil' },
  { value: '2', label: '🙁' },
  { value: '3', label: '😐 Normal' },
  { value: '4', label: '🙂' },
  { value: '5', label: '😄 Muy buena' },
];

export function ReviewForm({
  weekStart,
  rating,
  improve,
  nextPriority,
}: {
  weekStart: string;
  rating: number | null;
  improve: string | null;
  nextPriority: string | null;
}) {
  const [state, formAction] = useActionState(saveReview, IDLE_STATE);
  const [value, setValue] = useState<string>(rating ? String(rating) : '');
  const router = useRouter();
  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? 'Guardado.');
      router.push('/hoy');
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="week_start" value={weekStart} />
      {value && <input type="hidden" name="rating" value={value} />}
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-2 px-1">¿Cómo estuvo tu semana?</p>
        <ChoiceChips label="Cómo estuvo la semana" value={value} onChange={setValue} options={RATINGS} />
      </div>
      <Field label="¿Qué quiero mejorar la próxima semana?" htmlFor="review-improve">
        <Textarea id="review-improve" name="improve" rows={2} defaultValue={improve ?? ''} placeholder="Ej: Salir a la hora los jueves" />
      </Field>
      <Field label="¿Cuál será mi prioridad principal?" htmlFor="review-next" hint="Queda como foco de la próxima semana.">
        <Input id="review-next" name="next_priority" defaultValue={nextPriority ?? ''} placeholder="Ej: Cerrar compras de materiales" />
      </Field>
      <InlineMessage state={state.ok ? undefined : state} />
      <SubmitButton pendingText="Guardando…" className="w-full min-h-12">
        Cerrar la semana
      </SubmitButton>
    </form>
  );
}
