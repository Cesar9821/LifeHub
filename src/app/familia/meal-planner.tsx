'use client';

import { useActionState } from 'react';
import { Save } from 'lucide-react';
import { setMealPlan } from './actions';
import { IDLE_STATE } from '@/lib/action';
import { SubmitButton } from '@/components/ui/submit-button';
import { InlineMessage } from '@/components/ui/inline-message';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const inputCls =
  'w-full bg-black/30 border border-white/10 rounded-lg px-2.5 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50';

export default function MealPlanner({ plan }: { plan: Record<string, string> }) {
  const [state, formAction] = useActionState(setMealPlan, IDLE_STATE);

  return (
    <form action={formAction} className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-5 md:p-6 backdrop-blur-xl space-y-3">
      <InlineMessage state={state} />
      <div className="hidden sm:grid grid-cols-[70px_1fr_1fr] gap-2 px-1">
        <span />
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Almuerzo</span>
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cena</span>
      </div>
      <div className="space-y-2">
        {DAYS.map((day, d) => (
          <div key={d} className="grid grid-cols-1 sm:grid-cols-[70px_1fr_1fr] gap-2 sm:items-center">
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-wide">{day}</span>
            <input name={`m_${d}_almuerzo`} defaultValue={plan[`${d}_almuerzo`] ?? ''} placeholder="Almuerzo" className={inputCls} />
            <input name={`m_${d}_cena`} defaultValue={plan[`${d}_cena`] ?? ''} placeholder="Cena" className={inputCls} />
          </div>
        ))}
      </div>
      <SubmitButton pendingText="Guardando…" className="w-full">
        <Save size={14} /> Guardar menú
      </SubmitButton>
    </form>
  );
}
