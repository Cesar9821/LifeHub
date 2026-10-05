'use client';

import { useActionState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { setTopTask, toggleTopTask } from './actions';
import { IDLE_STATE } from '@/lib/action';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { InlineMessage } from '@/components/ui/inline-message';

export default function FrogCard({ topTask, done }: { topTask: string | null; done: boolean }) {
  const [state, formAction] = useActionState(setTopTask, IDLE_STATE);

  if (!topTask) {
    return (
      <form
        action={formAction}
        className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-3xl p-6 space-y-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🐸</span>
          <h2 className="text-sm font-semibold text-ink tracking-wide">La rana del día</h2>
        </div>
        <p className="text-xs text-ink-2">
          Tu tarea #1: la más importante y difícil. Cómetela <b>primero</b> (Brian Tracy).
        </p>
        <InlineMessage state={state} />
        <div className="flex gap-2">
          <Input
            name="top_task"
            required
            defaultValue={state.values?.top_task ?? ''}
            placeholder="¿Qué es lo más importante hoy?"
            invalid={!!state.fieldErrors?.top_task}
            className="flex-1"
          />
          <SubmitButton pendingText="…" className="bg-emerald-600 text-ink hover:bg-emerald-500">
            Fijar
          </SubmitButton>
        </div>
      </form>
    );
  }

  return (
    <div
      className={`border rounded-3xl p-6 ${
        done ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🐸</span>
        <h2 className="text-sm font-semibold text-ink tracking-wide">La rana del día</h2>
      </div>
      <form action={toggleTopTask} className="flex items-start gap-3">
        <input type="hidden" name="done" value={String(done)} />
        <button type="submit" className="mt-0.5 shrink-0" title={done ? 'Marcar pendiente' : 'Conquistar'}>
          {done ? (
            <CheckCircle2 size={26} className="text-emerald-400" />
          ) : (
            <Circle size={26} className="text-ink-3 hover:text-emerald-400 transition-colors" />
          )}
        </button>
        <p className={`text-lg font-semibold leading-snug ${done ? 'text-emerald-300 line-through' : 'text-ink'}`}>
          {topTask}
        </p>
      </form>
      <p className={`text-xs mt-2 ${done ? 'text-emerald-400 font-semibold tracking-wide' : 'text-ink-3'}`}>
        {done ? '¡Conquistada! 🔥' : 'Cómetela primero. El resto del día será cuesta abajo.'}
      </p>
    </div>
  );
}
