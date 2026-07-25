'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { addVariableMovement } from './actions';
import { CLPInput } from '@/components/ui/clp-input';

export default function VariableForm({
  categories,
}: {
  categories: { income: string[]; expense: string[] };
}) {
  const [kind, setKind] = useState<'income' | 'expense'>('expense');
  const [today, setToday] = useState('');

  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  const inputStyles =
    'bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all backdrop-blur-md w-full';

  const cats = kind === 'income' ? categories.income : categories.expense;

  return (
    <form
      action={addVariableMovement}
      className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl space-y-5"
    >
      <div className="flex items-center gap-2">
        <Plus size={18} className="text-indigo-400" />
        <h2 className="text-lg font-black text-white uppercase tracking-wider">Agregar movimiento</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1.5 lg:col-span-2">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Descripción</label>
          <input name="description" required placeholder="Ej: Compras del super" className={inputStyles} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Tipo</label>
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as 'income' | 'expense')}
            className={`${inputStyles} appearance-none pr-8`}
          >
            <option value="expense" className="bg-[#0A0C10]">Gasto</option>
            <option value="income" className="bg-[#0A0C10]">Ingreso</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Monto</label>
          <CLPInput name="amount" placeholder="25.000" required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Categoría</label>
          <select name="category" className={`${inputStyles} appearance-none pr-8`}>
            {cats.map((c) => (
              <option key={c} value={c} className="bg-[#0A0C10]">{c}</option>
            ))}
            <option value="General" className="bg-[#0A0C10]">General</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Fecha</label>
          <input name="due_date" type="date" value={today} onChange={(e) => setToday(e.target.value)} className={inputStyles} />
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 cursor-pointer pb-3">
          <input name="confirm_now" type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-500" />
          Ya pagado / recibido
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
