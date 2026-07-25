'use client';

import { useState } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import { depositSaving } from './actions';
import { CLPInput } from '@/components/ui/clp-input';

export default function SavingDeposit({ id }: { id: string }) {
  const [mode, setMode] = useState<'deposit' | 'withdraw' | null>(null);

  if (!mode) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMode('deposit')}
          title="Abonar"
          className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-emerald-500/20 transition-all active:scale-95"
        >
          <Plus size={13} /> Abonar
        </button>
        <button
          onClick={() => setMode('withdraw')}
          title="Retirar"
          className="flex items-center gap-1.5 bg-white/5 border border-white/5 text-slate-400 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider hover:text-rose-400 hover:border-rose-500/20 transition-all active:scale-95"
        >
          <Minus size={13} /> Retirar
        </button>
      </div>
    );
  }

  const isDeposit = mode === 'deposit';

  return (
    <form action={depositSaving} className="flex items-center gap-2 w-full">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="mode" value={mode} />
      <div className="flex-1 min-w-0">
        <CLPInput
          name="amount"
          placeholder={isDeposit ? 'Monto a abonar' : 'Monto a retirar'}
          autoFocus
          accent={isDeposit ? 'emerald' : 'indigo'}
        />
      </div>
      <button
        type="submit"
        className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 shrink-0 ${
          isDeposit
            ? 'bg-emerald-500 text-white hover:bg-emerald-400'
            : 'bg-slate-200 text-black hover:bg-white'
        }`}
      >
        {isDeposit ? 'Abonar' : 'Retirar'}
      </button>
      <button
        type="button"
        onClick={() => setMode(null)}
        className="p-2 text-slate-500 hover:text-white transition-colors shrink-0"
      >
        <X size={15} />
      </button>
    </form>
  );
}
