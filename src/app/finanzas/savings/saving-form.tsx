'use client';

import { useState, useRef } from 'react';
import { Plus, Target } from 'lucide-react';
import { addSaving } from './actions';

function formatCLP(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('es-CL').format(parseInt(digits));
}

export default function SavingForm({ inputStyles }: { inputStyles: string }) {
  const [displayAmount, setDisplayAmount] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addSaving(formData);
        formRef.current?.reset();
        setDisplayAmount('');
      }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Nombre de la Meta</label>
        <input
          name="name"
          placeholder="Ej: Fondo de Emergencia"
          className={inputStyles}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Monto Objetivo (CLP)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 font-mono font-bold">$</span>
          <input
            type="text"
            value={displayAmount}
            onChange={(e) => setDisplayAmount(formatCLP(e.target.value))}
            placeholder="0"
            className={`${inputStyles} pl-7 font-mono font-black text-amber-400 text-lg`}
            required
          />
          <input
            type="hidden"
            name="target_amount"
            value={displayAmount.replace(/\./g, '').replace(/,/g, '')}
          />
        </div>
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-slate-200 transition-all active:scale-95 shadow-[0_10px_20px_-10px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest"
        >
          <Plus size={18} strokeWidth={3} /> Activar Meta
        </button>
      </div>
    </form>
  );
}
