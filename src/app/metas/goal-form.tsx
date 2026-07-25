'use client';

import { Plus } from 'lucide-react';
import { addGoal } from './actions';

const CATEGORIES = [
  'Personal',
  'Salud',
  'Finanzas',
  'Carrera',
  'Aprendizaje',
  'Relaciones',
];

export default function GoalForm() {
  const inputStyles =
    'bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all w-full';

  return (
    <form
      action={addGoal}
      className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl space-y-5"
    >
      <div className="flex items-center gap-2">
        <Plus size={18} className="text-amber-400" />
        <h2 className="text-lg font-black text-white uppercase tracking-wider">Nueva meta</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
            Objetivo
          </label>
          <input
            name="title"
            required
            placeholder="Ej: Correr una maratón, Ahorrar para un viaje…"
            className={inputStyles}
          />
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
            Detalle (opcional)
          </label>
          <input
            name="description"
            placeholder="Por qué importa, cómo lo medirás…"
            className={inputStyles}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
            Categoría
          </label>
          <select name="category" defaultValue="Personal" className={`${inputStyles} appearance-none pr-8`}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[#0A0C10]">{c}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
            Fecha límite (opcional)
          </label>
          <input name="target_date" type="date" className={inputStyles} />
        </div>
        <button
          type="submit"
          className="bg-white text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95"
        >
          <Plus size={15} /> Crear meta
        </button>
      </div>
    </form>
  );
}
