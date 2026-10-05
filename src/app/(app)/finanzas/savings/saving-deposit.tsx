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
          type="button"
          className="flex items-center gap-1.5 min-h-11 bg-success/10 border border-success/25 text-success px-4 rounded-xl font-semibold text-sm hover:bg-success/20 transition-all active:scale-95"
        >
          <Plus size={13} /> Abonar
        </button>
        <button
          onClick={() => setMode('withdraw')}
          title="Retirar"
          type="button"
          className="flex items-center gap-1.5 min-h-11 bg-surface-2 border border-line-strong text-ink-2 px-4 rounded-xl font-semibold text-sm hover:text-ink transition-all active:scale-95"
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
        className={`min-h-11 px-4 rounded-xl font-semibold text-sm transition-all active:scale-95 shrink-0 ${
          isDeposit ? 'bg-success text-bg hover:bg-success/90' : 'bg-ink text-bg hover:bg-white'
        }`}
      >
        {isDeposit ? 'Abonar' : 'Retirar'}
      </button>
      <button
        type="button"
        onClick={() => setMode(null)}
        aria-label="Cancelar"
        className="h-11 w-11 inline-flex items-center justify-center text-ink-3 hover:text-ink transition-colors shrink-0"
      >
        <X size={15} />
      </button>
    </form>
  );
}
