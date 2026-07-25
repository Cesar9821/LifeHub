'use client';

import { useState, useRef } from 'react';
import { Plus, ReceiptText, ChevronDown } from 'lucide-react';
import { addTransaction } from './actions';

// Formatea en pesos chilenos (puntos como separador de miles)
function formatCLP(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('es-CL').format(parseInt(digits));
}

export default function TransactionForm({ savings, credits, categories, inputStyles }: any) {
  const CATEGORIES: string[] =
    categories && categories.length > 0 ? categories : ['General'];
  const [type, setType] = useState('expense');
  const [destination, setDestination] = useState('normal');
  const [displayAmount, setDisplayAmount] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setType(e.target.value);
    setDestination('normal');
  };

  return (
    <div className="p-5 md:p-8 bg-slate-900/30 backdrop-blur-2xl border border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden">
      <div className="flex items-center gap-3 mb-6 md:mb-8 text-indigo-400">
        <ReceiptText size={20} />
        <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">Nuevo Movimiento</h2>
      </div>

      <form
        ref={formRef}
        action={async (formData) => {
          await addTransaction(formData);
          formRef.current?.reset();
          setDisplayAmount('');
          setDestination('normal');
          setType('expense');
        }}
        className="space-y-4 md:space-y-5"
      >
        {/* Fila 1: Descripción + Monto + Tipo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5 lg:col-span-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Descripción</label>
            <input
              name="description"
              placeholder="Ej: Supermercado Líder"
              className={inputStyles}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Monto (CLP $)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold text-sm">$</span>
              <input
                type="text"
                value={displayAmount}
                onChange={(e) => setDisplayAmount(formatCLP(e.target.value))}
                placeholder="0"
                className={`${inputStyles} pl-7 font-bold text-indigo-400 font-mono`}
                required
              />
              <input type="hidden" name="amount" value={displayAmount.replace(/\./g, '').replace(/,/g, '')} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Tipo</label>
            <div className="relative">
              <select
                name="type"
                className={`${inputStyles} font-bold appearance-none pr-8`}
                value={type}
                onChange={handleTypeChange}
              >
                <option value="expense" className="bg-[#0A0C10]">🔴 Gasto / Salida</option>
                <option value="income" className="bg-[#0A0C10]">🟢 Ingreso / Entrada</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Categoría</label>
            <div className="relative">
              <select name="category" className={`${inputStyles} appearance-none pr-8`}>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-[#0A0C10]">{cat}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Fila 2: Destino */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Destino</label>
            <div className="relative">
              <select
                name="destination"
                className={`${inputStyles} font-bold text-indigo-400 appearance-none pr-8`}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                {type === 'expense' ? (
                  <>
                    <option value="normal" className="bg-[#0A0C10]">💸 Gasto General</option>
                    <option value="saving" className="bg-[#0A0C10]">🏦 Depósito a Ahorro</option>
                    <option value="withdraw_saving" className="bg-[#0A0C10]">↩️ Retiro de Ahorro</option>
                    <option value="credit" className="bg-[#0A0C10]">💳 Pago de Crédito</option>
                  </>
                ) : (
                  <>
                    <option value="normal" className="bg-[#0A0C10]">💰 Ingreso a Capital</option>
                    <option value="saving" className="bg-[#0A0C10]">🏦 Directo a Ahorro</option>
                  </>
                )}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Selector dinámico de ahorro o crédito */}
          {(destination === 'saving' || destination === 'withdraw_saving') && (
            <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-300">
              <label className={`text-[9px] font-black uppercase tracking-widest px-1 ${destination === 'withdraw_saving' ? 'text-rose-400' : 'text-amber-500'}`}>
                {destination === 'withdraw_saving' ? '↩️ Fondo a Retirar' : '🎯 Meta Destino'}
              </label>
              <div className="relative">
                <select
                  name="saving_id"
                  className={`${inputStyles} appearance-none pr-8 ${destination === 'withdraw_saving' ? 'text-rose-300 border-rose-500/20' : 'text-amber-300 border-amber-500/20'}`}
                  required
                >
                  <option value="" className="bg-[#0A0C10]">Seleccionar fondo...</option>
                  {savings?.map((s: any) => (
                    <option key={s.id} value={s.id} className="bg-[#0A0C10]">{s.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
          )}

          {destination === 'credit' && (
            <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest px-1">💳 Crédito a Abonar</label>
              <div className="relative">
                <select
                  name="credit_id"
                  className={`${inputStyles} text-rose-300 border-rose-500/20 appearance-none pr-8`}
                  required
                >
                  <option value="" className="bg-[#0A0C10]">Seleccionar deuda...</option>
                  {credits?.map((c: any) => (
                    <option key={c.id} value={c.id} className="bg-[#0A0C10]">{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto px-10 bg-white text-black font-black py-4 rounded-xl md:rounded-2xl hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase text-[10px] md:text-[11px] tracking-widest shadow-xl"
          >
            <Plus size={18} strokeWidth={3} /> Registrar Movimiento
          </button>
        </div>
      </form>
    </div>
  );
}
