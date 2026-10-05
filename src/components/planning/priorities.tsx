'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { addPriority, addPriorityFromTask, removePriority, togglePriority } from '@/app/(app)/tareas/actions';
import { IDLE_STATE } from '@/lib/action';
import { cn } from '@/lib/utils';
import { MAX_PRIORITIES } from '@/lib/planning/priorities';
import type { Area } from '@/lib/planning/areas';
import { CheckButton } from '@/components/ui/check-button';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { AreaDot } from './area';

export interface PriorityView {
  id: string;
  position: number;
  title: string;
  area: Area | null;
  done: boolean;
}

export interface Suggestion {
  /** Tarea de la que viene (si no, se agrega solo el texto). */
  taskId: string | null;
  title: string;
  hint: string | null;
}

function SuggestionChip({ s }: { s: Suggestion }) {
  return (
    <form action={addPriorityFromTask} className="min-w-0 max-w-full">
      {s.taskId ? <input type="hidden" name="task_id" value={s.taskId} /> : <input type="hidden" name="title" value={s.title} />}
      <button
        type="submit"
        className="min-h-11 w-full max-w-full inline-flex items-center gap-1.5 px-3.5 rounded-full border border-dashed border-line-strong text-sm text-ink-2 hover:text-ink hover:border-accent/50 text-left"
      >
        <Plus size={14} className="shrink-0" />
        <span className="truncate min-w-0">{s.title}</span>
        {s.hint && <span className="text-ink-3 shrink-0">· {s.hint}</span>}
      </button>
    </form>
  );
}

function AddPriority() {
  const [state, formAction] = useActionState(addPriority, IDLE_STATE);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={formAction} className="space-y-2">
      <div className="flex gap-2">
        <label htmlFor="priority-title" className="sr-only">
          Agregar lo importante
        </label>
        <input
          id="priority-title"
          name="title"
          autoComplete="off"
          maxLength={200}
          placeholder="¿Qué es lo importante hoy?"
          className="flex-1 min-w-0 min-h-11 bg-surface-2 border border-line-strong rounded-xl px-3 text-[15px] text-ink placeholder:text-ink-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
        />
        <SubmitButton aria-label="Agregar prioridad" className="min-h-11 px-4 shrink-0">
          <Plus size={18} />
        </SubmitButton>
      </div>
      {!state.ok && <InlineMessage state={state} />}
    </form>
  );
}

const BURST_COLORS = ['#60a5fa', '#2dd4bf', '#34d399', '#a3e635', '#fb923c', '#c084fc', '#8b9cff', '#fbbf24'];

/** Celebración al cumplir todo lo importante (con la racha, si hay). */
function Celebration({ streak }: { streak: number }) {
  return (
    <div role="status" className="burst animate-pop rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-center">
      {BURST_COLORS.map((c, i) => {
        const a = (i / BURST_COLORS.length) * Math.PI * 2;
        return (
          <i
            key={c}
            aria-hidden
            style={{ background: c, ['--x' as string]: `${Math.round(Math.cos(a) * 90)}px`, ['--y' as string]: `${Math.round(Math.sin(a) * 40)}px` }}
          />
        );
      })}
      <p className="text-[15px] font-semibold text-success">🎉 Lo importante está hecho</p>
      <p className="text-sm text-ink-2">
        {streak > 1 ? `${streak} días seguidos cumpliendo. Lo demás es extra.` : 'Lo demás es extra. Bien hecho.'}
      </p>
    </div>
  );
}

/** "Lo importante": máximo 3, se marcan con un toque. */
export function Priorities({ items, suggestions, streak = 0 }: { items: PriorityView[]; suggestions: Suggestion[]; streak?: number }) {
  const full = items.length >= MAX_PRIORITIES;
  const allDone = items.length > 0 && items.every((p) => p.done);

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <ol className="space-y-1">
          {items.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 min-h-12 group">
              <form action={togglePriority}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="done" value={String(p.done)} />
                <CheckButton done={p.done} label={p.title} />
              </form>
              <span className="text-sm font-semibold text-ink-3 tabular-nums w-4">{i + 1}</span>
              <span className={cn('flex-1 min-w-0 text-[16px] leading-snug', p.done ? 'text-ink-3 line-through' : 'text-ink font-medium')}>
                {p.title}
              </span>
              <AreaDot area={p.area} />
              <form action={removePriority}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  aria-label={`Quitar de lo importante: ${p.title}`}
                  className="h-11 w-11 -mr-2 inline-flex items-center justify-center rounded-full text-ink-3 hover:text-ink hover:bg-surface-2"
                >
                  <X size={16} />
                </button>
              </form>
            </li>
          ))}
        </ol>
      )}

      {allDone && <Celebration streak={streak} />}

      {full ? (
        !allDone && <p className="text-sm text-ink-3">Tres es suficiente. Si aparece algo más importante, quita uno.</p>
      ) : (
        <>
          {items.length === 0 && (
            <p className="text-[15px] text-ink-2">Elige hasta 3 cosas. Si haces solo eso, el día estuvo bien.</p>
          )}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, MAX_PRIORITIES - items.length + 1).map((s) => (
                <SuggestionChip key={s.taskId ?? s.title} s={s} />
              ))}
            </div>
          )}
          <AddPriority />
        </>
      )}
    </div>
  );
}
