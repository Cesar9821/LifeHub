'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { addRecurring } from './actions';
import { CLPInput } from '@/components/ui/clp-input';

export default function RecurringForm({
  categories,
}: {
  categories: { income: string[]; expense: string[] };
}) {
  const [kind, setKind] = useState<'income' | 'expense'>('expense');

  const inputStyles =
    'bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all backdrop-blur-md w-full';

  const cats = kind === 'income' ? categories.income : categories.expense;

  return (
    <form
      action={addRecurring}
      className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl space-y-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1.5 lg:col-span-2">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
            Descripción
          </label>
          <input name="description" required placeholder="Ej: Sueldo, Arriendo, Netflix…" className={inputStyles} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Tipo</label>
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as 'income' | 'expense')}
            className={`${inputStyles} appearance-none pr-8`}
          >
            <option value="expense" className="bg-[#0A0C10]">Gasto fijo</option>
            <option value="income" className="bg-[#0A0C10]">Ingreso fijo</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
            Día del mes (1-31)
          </label>
          <input name="due_day" type="number" min="1" max="31" required placeholder="5" className={inputStyles} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
            Monto (o estimado)
          </label>
          <CLPInput name="amount" placeholder="150.000" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Categoría</label>
          <select name="category" className={`${inputStyles} appearance-none pr-8`}>
            {cats.map((c) => (
              <option key={c} value={c} className="bg-[#0A0C10]">{c}</option>
            ))}
            <option value="General" className="bg-[#0A0C10]">General</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 cursor-pointer pb-3">
          <input name="is_variable" type="checkbox" className="w-4 h-4 accent-indigo-500" />
          Monto variable (luz, agua…)
        </label>
        <button
          type="submit"
          className="bg-white text-black px-6 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>
    </form>
  );
}
