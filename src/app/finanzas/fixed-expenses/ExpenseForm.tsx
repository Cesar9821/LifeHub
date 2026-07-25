'use client';

import React, { useState } from 'react';
import { Plus, Calendar, Tag, DollarSign, Quote } from 'lucide-react';

function formatCLP(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('es-CL').format(parseInt(digits));
}

export default function ExpenseForm({ addExpenseAction }: { addExpenseAction: (formData: FormData) => void }) {
  const [formattedAmount, setFormattedAmount] = useState('');
  const [rawAmount, setRawAmount] = useState('');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setRawAmount(digits);
    setFormattedAmount(digits ? new Intl.NumberFormat('es-CL').format(parseInt(digits)) : '');
  };

  return (
    <form action={addExpenseAction} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Descripción</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors">
            <Quote size={18} />
          </div>
          <input
            name="description"
            placeholder="Ej: Netflix, Arriendo..."
            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-white outline-none focus:border-indigo-500/50 focus:bg-slate-900 transition-all font-medium placeholder:text-slate-700"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Categoría</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors">
            <Tag size={18} />
          </div>
          <select
            name="category"
            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-white outline-none focus:border-indigo-500/50 focus:bg-slate-900 transition-all font-medium appearance-none cursor-pointer"
            required
          >
            <option value="Vivienda">🏠 Vivienda</option>
            <option value="Servicios">💡 Servicios básicos</option>
            <option value="Suscripciones">📱 Suscripciones</option>
            <option value="Transporte">🚗 Transporte</option>
            <option value="Salud">🏥 Salud</option>
            <option value="Educación">📚 Educación</option>
            <option value="Seguros">🛡️ Seguros</option>
            <option value="Otros">📦 Otros</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Monto (CLP)</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors">
              <DollarSign size={18} />
            </div>
            <input
              type="text"
              value={formattedAmount}
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-white outline-none focus:border-indigo-500/50 focus:bg-slate-900 transition-all font-mono"
              required
            />
            <input type="hidden" name="amount" value={rawAmount} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Día de Cobro</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors">
              <Calendar size={18} />
            </div>
            <input
              name="due_day"
              type="number"
              min="1"
              max="31"
              placeholder="1-31"
              className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-white outline-none focus:border-indigo-500/50 focus:bg-slate-900 transition-all font-mono"
              required
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group mt-4 shadow-lg shadow-indigo-500/20"
      >
        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
        REGISTRAR GASTO FIJO
      </button>
    </form>
  );
}
