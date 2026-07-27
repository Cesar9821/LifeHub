'use client';

import { useState, useActionState } from 'react';
import { Moon, Zap, Smile, Droplets, Plus, Minus, Save } from 'lucide-react';
import { saveDailyLog, addWater } from './actions';
import { IDLE_STATE } from '@/lib/action';
import { SubmitButton } from '@/components/ui/submit-button';
import { InlineMessage } from '@/components/ui/inline-message';

const MOODS = ['😞', '😕', '😐', '🙂', '😄'];

export default function DailyPanel({
  sleepHours,
  mood,
  energy,
  waterMl,
  weightKg,
  reflection,
}: {
  sleepHours: number | null;
  mood: number | null;
  energy: number | null;
  waterMl: number;
  weightKg: number | null;
  reflection: string | null;
}) {
  const [selectedMood, setSelectedMood] = useState<number | null>(mood);
  const [selectedEnergy, setSelectedEnergy] = useState<number | null>(energy);
  const [saveState, saveAction] = useActionState(saveDailyLog, IDLE_STATE);

  const waterGlasses = Math.round(waterMl / 250);
  const waterGoal = 8;
  const waterPercent = Math.min((waterGlasses / waterGoal) * 100, 100);

  const inputStyles =
    'bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all w-full';

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 backdrop-blur-xl space-y-6">
      <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
        Registro de hoy
      </h2>

      {/* AGUA — acción rápida */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplets size={15} className="text-sky-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Agua
            </span>
          </div>
          <span className="text-xs font-black font-mono text-white">
            {waterGlasses} / {waterGoal} vasos
          </span>
        </div>
        <div className="h-2 bg-black/40 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-sky-500 rounded-full transition-all duration-500"
            style={{ width: `${waterPercent}%` }}
          />
        </div>
        <div className="flex items-center gap-2">
          <form action={addWater} className="flex-1">
            <input type="hidden" name="ml" value="250" />
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-sky-500/20 transition-all active:scale-95"
            >
              <Plus size={13} /> Vaso
            </button>
          </form>
          <form action={addWater}>
            <input type="hidden" name="ml" value="-250" />
            <button
              type="submit"
              disabled={waterGlasses <= 0}
              className="p-2.5 bg-white/5 border border-white/5 text-slate-500 rounded-xl hover:text-white transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            >
              <Minus size={13} />
            </button>
          </form>
        </div>
      </div>

      {/* FORMULARIO */}
      <form action={saveAction} className="space-y-5 pt-2 border-t border-white/5">
        {/* Ánimo */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Smile size={15} className="text-amber-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Ánimo
            </span>
          </div>
          <div className="flex gap-2">
            {MOODS.map((emoji, i) => {
              const value = i + 1;
              const active = selectedMood === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedMood(value)}
                  className={`flex-1 py-2.5 rounded-xl text-lg border transition-all active:scale-95 ${
                    active
                      ? 'bg-amber-500/20 border-amber-500/40'
                      : 'bg-black/20 border-white/5 opacity-40 hover:opacity-70'
                  }`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="mood" value={selectedMood ?? ''} />
        </div>

        {/* Energía */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} className="text-violet-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Energía
            </span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => {
              const active = (selectedEnergy ?? 0) >= value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedEnergy(value)}
                  className={`flex-1 h-9 rounded-xl border transition-all active:scale-95 ${
                    active
                      ? 'bg-violet-500 border-violet-400'
                      : 'bg-black/20 border-white/5 hover:border-violet-500/30'
                  }`}
                />
              );
            })}
          </div>
          <input type="hidden" name="energy" value={selectedEnergy ?? ''} />
        </div>

        {/* Sueño y peso */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Moon size={14} className="text-indigo-400" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                Sueño (h)
              </span>
            </div>
            <input
              name="sleep_hours"
              type="number"
              step="0.5"
              min="0"
              max="24"
              defaultValue={sleepHours ?? ''}
              placeholder="7.5"
              className={inputStyles}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                Peso (kg)
              </span>
            </div>
            <input
              name="weight_kg"
              type="number"
              step="0.1"
              min="0"
              defaultValue={weightKg ?? ''}
              placeholder="75.0"
              className={inputStyles}
            />
          </div>
        </div>

        {/* Reflexión nocturna */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">🌙 Reflexión de hoy</span>
          </div>
          <textarea
            name="reflection"
            rows={2}
            defaultValue={reflection ?? ''}
            placeholder="¿Qué conquistaste? ¿Qué evitaste? Honestidad brutal."
            className={`${inputStyles} resize-none`}
          />
        </div>

        <input type="hidden" name="water_ml" value={waterMl} />

        <InlineMessage state={saveState} />

        <SubmitButton pendingText="Guardando…" className="w-full">
          <Save size={14} /> Guardar registro
        </SubmitButton>
      </form>
    </div>
  );
}
