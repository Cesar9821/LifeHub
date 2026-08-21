'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import { addVariableMovement } from '@/app/finanzas/movimientos/actions';
import { IDLE_STATE } from '@/lib/action';
import { CLPInput } from '@/components/ui/clp-input';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';

const inputCls =
  'w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-white/15 focus:border-white/25 transition-all';

export default function QuickAdd({
  categories,
  dueDate,
}: {
  categories: { income: string[]; expense: string[] };
  dueDate: string;
}) {
  const [kind, setKind] = useState<'income' | 'expense' | null>(null);
  const [state, formAction] = useActionState(addVariableMovement, IDLE_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKind(null);
    }
  }, [state]);

  if (kind === null) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setKind('income')}
          className="flex flex-col items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-[2rem] py-9 hover:bg-emerald-500/20 transition-all active:scale-95"
        >
          <Plus size={34} className="text-emerald-400" strokeWidth={3} />
          <span className="text-sm font-black text-emerald-300 uppercase tracking-wider">Agregar ingreso</span>
        </button>
        <button
          onClick={() => setKind('expense')}
          className="flex flex-col items-center justify-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-[2rem] py-9 hover:bg-rose-500/20 transition-all active:scale-95"
        >
          <Minus size={34} className="text-rose-400" strokeWidth={3} />
          <span className="text-sm font-black text-rose-300 uppercase tracking-wider">Agregar gasto</span>
        </button>
      </div>
    );
  }

  const isIncome = kind === 'income';
  const cats = isIncome ? categories.income : categories.expense;

  return (
    <form
      ref={formRef}
      action={formAction}
      className={`rounded-[2rem] p-6 border space-y-4 ${isIncome ? 'bg-emerald-500/5 border-emerald-500/25' : 'bg-rose-500/5 border-rose-500/25'}`}
    >
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-black uppercase tracking-wider ${isIncome ? 'text-emerald-300' : 'text-rose-300'}`}>
          {isIncome ? 'Nuevo ingreso' : 'Nuevo gasto'}
        </h2>
        <button type="button" onClick={() => setKind(null)} className="text-slate-500 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="due_date" value={dueDate} />
      <input type="hidden" name="confirm_now" value="on" />

      <InlineMessage state={state} />

      <CLPInput
        name="amount"
        placeholder="25.000"
        required
        autoFocus
        accent={isIncome ? 'emerald' : 'indigo'}
        className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-4 text-2xl font-black text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-white/15"
      />

      <input
        name="description"
        required
        defaultValue={state.values?.description ?? ''}
        placeholder={isIncome ? 'Ej: Sueldo, venta…' : 'Ej: Súper, bencina…'}
        className={inputCls}
      />

      <select name="category" className={`${inputCls} appearance-none pr-8`}>
        {cats.map((c) => (
          <option key={c} value={c} className="bg-[#0A0C10]">{c}</option>
        ))}
        <option value="General" className="bg-[#0A0C10]">General</option>
      </select>

      <SubmitButton
        pendingText="Guardando…"
        className={`w-full py-4 text-sm ${isIncome ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-rose-600 text-white hover:bg-rose-500'}`}
      >
        Guardar {isIncome ? 'ingreso' : 'gasto'}
      </SubmitButton>
    </form>
  );
}
