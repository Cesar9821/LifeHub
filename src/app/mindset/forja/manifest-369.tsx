'use client';

import { useActionState } from 'react';
import { Sunrise, Sun, Moon, Save, PenLine, Check, Flame } from 'lucide-react';
import { save369Affirmation, add369Rep } from '../actions';
import { IDLE_STATE } from '@/lib/action';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { InlineMessage } from '@/components/ui/inline-message';
import type { Manifest369State } from '@/services/manifest369';

const BLOCKS = [
  { key: 'morning', label: 'Mañana', target: 3, icon: Sunrise },
  { key: 'afternoon', label: 'Tarde', target: 6, icon: Sun },
  { key: 'night', label: 'Noche', target: 9, icon: Moon },
] as const;

function currentBlock(): 'morning' | 'afternoon' | 'night' {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'night';
}

export default function Manifest369({ state }: { state: Manifest369State }) {
  const { today, lastAffirmation, complete } = state;
  const [saveState, saveAction] = useActionState(save369Affirmation, IDLE_STATE);

  const affirmation = today.affirmation || lastAffirmation;
  const hasAffirmation = Boolean(affirmation.trim());
  const now = currentBlock();

  return (
    <div className="space-y-5">
      {/* Afirmación / meta del día */}
      <form action={saveAction} className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-7 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2">
          <PenLine size={18} className="text-violet-400" />
          <h2 className="text-lg font-black text-white uppercase tracking-wider">Tu afirmación</h2>
        </div>
        <p className="text-xs text-slate-500 font-medium -mt-1">
          Escríbela en presente, como si ya fuera tuya. Ej: &ldquo;Soy imparable y disciplinado&rdquo;.
        </p>
        <InlineMessage state={saveState} />
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            name="affirmation"
            required
            defaultValue={affirmation}
            placeholder="Soy imparable. No me quiebro."
            invalid={!!saveState.fieldErrors?.affirmation}
            className="flex-1 text-base"
          />
          <SubmitButton pendingText="Guardando…">
            <Save size={15} /> Guardar
          </SubmitButton>
        </div>
      </form>

      {/* Estado completo */}
      {complete && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl px-5 py-4">
          <Flame size={20} className="text-emerald-400 shrink-0" />
          <p className="text-sm font-black text-emerald-300 uppercase tracking-wide">
            Manifestación completa hoy. Mente forjada. 🔥
          </p>
        </div>
      )}

      {/* Bloques 3 · 6 · 9 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BLOCKS.map((b) => {
          const count = today[b.key];
          const done = count >= b.target;
          const isNow = now === b.key;
          const Icon = b.icon;
          return (
            <div
              key={b.key}
              className={`rounded-[1.75rem] p-5 border backdrop-blur-xl transition-all ${
                done
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : isNow
                    ? 'bg-slate-900/50 border-violet-500/30'
                    : 'bg-slate-900/30 border-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon size={16} className={done ? 'text-emerald-400' : 'text-violet-400'} />
                  <span className="text-xs font-black text-white uppercase tracking-widest">{b.label}</span>
                </div>
                <span className={`text-xs font-black font-mono ${done ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {count}/{b.target}
                </span>
              </div>

              {/* Puntos de progreso */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {Array.from({ length: b.target }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-2 flex-1 min-w-[10px] rounded-full ${
                      i < count ? (done ? 'bg-emerald-500' : 'bg-violet-500') : 'bg-black/40'
                    }`}
                  />
                ))}
              </div>

              {done ? (
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-[11px] font-black uppercase tracking-widest py-2.5">
                  <Check size={14} /> Completo
                </div>
              ) : (
                <form action={add369Rep} className="space-y-2">
                  <input type="hidden" name="block" value={b.key} />
                  <input
                    type="text"
                    placeholder={hasAffirmation ? affirmation : 'Primero guarda tu afirmación'}
                    disabled={!hasAffirmation}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 disabled:opacity-40"
                  />
                  <SubmitButton
                    pendingText="…"
                    disabled={!hasAffirmation}
                    className="w-full bg-violet-600 text-white hover:bg-violet-500"
                  >
                    <PenLine size={14} /> Escribir ({count + 1}/{b.target})
                  </SubmitButton>
                </form>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-600 text-center leading-relaxed">
        Escríbela con intención cada vez. 3 en la mañana, 6 en la tarde, 9 en la noche.
        La repetición la graba en tu identidad.
      </p>
    </div>
  );
}
