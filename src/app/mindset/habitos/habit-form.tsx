'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { addHabit } from '../actions';

export default function HabitForm() {
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');

  const inputStyles =
    'bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all w-full';

  return (
    <form
      action={addHabit}
      className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl space-y-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
            Hábito
          </label>
          <input
            name="name"
            required
            placeholder="Ej: Entrenar, Leer 30 min, Meditar…"
            className={inputStyles}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
            Detalle (opcional)
          </label>
          <input
            name="description"
            placeholder="Ej: 6:00 AM, sin excusas"
            className={inputStyles}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
            Tipo
          </label>
          <select name="kind" defaultValue="build" className={`${inputStyles} appearance-none pr-8`}>
            <option value="build" className="bg-[#0A0C10]">Quiero hacerlo</option>
            <option value="break" className="bg-[#0A0C10]">Quiero evitarlo</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
            Frecuencia
          </label>
          <select
            name="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly')}
            className={`${inputStyles} appearance-none pr-8`}
          >
            <option value="daily" className="bg-[#0A0C10]">Todos los días</option>
            <option value="weekly" className="bg-[#0A0C10]">Veces por semana</option>
          </select>
        </div>

        {frequency === 'weekly' ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
              Veces por semana
            </label>
            <input
              name="target_per_week"
              type="number"
              min="1"
              max="7"
              defaultValue={3}
              className={inputStyles}
            />
          </div>
        ) : (
          <input type="hidden" name="target_per_week" value={7} />
        )}

        <button
          type="submit"
          className={`bg-white text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95 ${
            frequency === 'weekly' ? 'md:col-span-3' : ''
          }`}
        >
          <Plus size={15} /> Crear hábito
        </button>
      </div>
    </form>
  );
}
