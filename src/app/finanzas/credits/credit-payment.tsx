'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { payCreditInstallment } from './actions';
import { CLPInput } from '@/components/ui/clp-input';

export default function CreditPayment({
  id,
  installmentValue,
  isFinished,
}: {
  id: string;
  installmentValue: number;
  isFinished: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (isFinished) {
    return (
      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
        Pagado
      </span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Pagar cuota"
        className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-emerald-500/20 transition-all active:scale-95"
      >
        <Check size={13} /> Pagar cuota
      </button>
    );
  }

  return (
    <form action={payCreditInstallment} className="flex items-center gap-2 w-full">
      <input type="hidden" name="id" value={id} />
      <div className="flex-1 min-w-0">
        <CLPInput
          name="amount"
          defaultValue={installmentValue}
          placeholder="Monto de la cuota"
          autoFocus
          accent="emerald"
        />
      </div>
      <button
        type="submit"
        className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-emerald-400 transition-all active:scale-95 shrink-0"
      >
        Confirmar
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="p-2 text-slate-500 hover:text-white transition-colors shrink-0"
      >
        <X size={15} />
      </button>
    </form>
  );
}
