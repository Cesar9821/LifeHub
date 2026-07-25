'use client';

import { useState, useRef } from 'react';
import { Plus, CreditCard, ChevronDown } from 'lucide-react';
import { addCredit } from './actions';

function formatCLP(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('es-CL').format(parseInt(digits));
}

export default function CreditForm({ inputStyles }: { inputStyles: string }) {
  const [totalCTC, setTotalCTC] = useState('');
  const [valorCuota, setValorCuota] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addCredit(formData);
        formRef.current?.reset();
        setTotalCTC('');
        setValorCuota('');
      }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 md:gap-6"
    >
      {/* Nombre */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-slate-500 uppercase px-1 italic tracking-widest">Nombre Crédito</label>
        <input name="name" placeholder="Ej: Crédito Casa" className={inputStyles} required />
      </div>

      {/* Total CTC */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-rose-500/70 uppercase px-1 italic tracking-widest">Total a Pagar (CTC)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 font-mono font-bold">$</span>
          <input
            type="text"
            value={totalCTC}
            onChange={(e) => setTotalCTC(formatCLP(e.target.value))}
            placeholder="0"
            className={`${inputStyles} pl-7 font-mono font-bold text-slate-300`}
            required
          />
          <input type="hidden" name="total_amount" value={totalCTC.replace(/\./g, '').replace(/,/g, '')} />
        </div>
      </div>

      {/* Valor Cuota */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-slate-500 uppercase px-1 italic tracking-widest">Valor Cuota Mensual</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 font-mono font-bold">$</span>
          <input
            type="text"
            value={valorCuota}
            onChange={(e) => setValorCuota(formatCLP(e.target.value))}
            placeholder="0"
            className={`${inputStyles} pl-7 font-mono font-bold text-rose-400`}
            required
          />
          <input type="hidden" name="installment_value" value={valorCuota.replace(/\./g, '').replace(/,/g, '')} />
        </div>
      </div>

      {/* Cuotas */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-slate-500 uppercase px-1 italic tracking-widest">Cuotas Pagadas / Total</label>
        <div className="flex gap-2 items-center">
          <input name="paid_installments" type="number" placeholder="0" className={`${inputStyles} w-full`} required min="0" defaultValue="0" />
          <span className="text-slate-600 font-bold text-lg">/</span>
          <input name="total_installments" type="number" placeholder="12" className={`${inputStyles} w-full`} required min="1" />
        </div>
      </div>

      {/* Botón */}
      <div className="flex items-end mt-2 md:mt-0">
        <button type="submit" className="w-full bg-white text-black font-black py-4 md:py-3.5 rounded-2xl hover:bg-slate-200 transition-all active:scale-95 uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center">
          <Plus size={16} strokeWidth={3} className="mr-2" /> Registrar
        </button>
      </div>
    </form>
  );
}
