'use client';

import { useActionState, useState } from 'react';
import { AlertTriangle, Database, Sparkles } from 'lucide-react';
import { seedPlan } from '@/app/finanzas/plan/actions';
import { IDLE_STATE } from '@/lib/action';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';

/** Primer arranque: limpia los datos antiguos de Finanzas y carga el plan del hogar. */
export function SeedPlanCard() {
  const [state, formAction] = useActionState(seedPlan, IDLE_STATE);
  const [wipe, setWipe] = useState(true);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/25 rounded-[2rem] p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-300 shrink-0">
          <Sparkles size={20} />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-white">Cargar el plan del hogar</h2>
          <p className="text-sm text-slate-400">
            Octubre 2026 a septiembre 2027: sueldos, gastos por concepto, deuda CMR con su plan de adelantos
            (pago fijo $250.000 desde noviembre) y el aporte de cada uno.
          </p>
        </div>
      </div>

      <InlineMessage state={state} />

      <form action={formAction} className="space-y-4">
        {wipe && <input type="hidden" name="wipe" value="on" />}

        <label className="flex items-start gap-3 cursor-pointer bg-black/20 border border-white/5 rounded-2xl p-4">
          <input
            type="checkbox"
            checked={wipe}
            onChange={(e) => {
              setWipe(e.target.checked);
              setConfirming(false);
            }}
            className="mt-0.5 w-5 h-5 accent-rose-500 shrink-0"
          />
          <span className="text-sm text-slate-300">
            <span className="font-black text-white">Borrar los datos antiguos de Finanzas</span> de este hogar:
            movimientos, planificación, presupuestos, créditos y categorías. Ahorros, metas y el resto de LifeHub
            no se tocan.
          </span>
        </label>

        {wipe && confirming ? (
          <div className="space-y-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-rose-300">
              <AlertTriangle size={16} className="shrink-0" /> Esto borra el historial anterior y no se puede deshacer.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="min-h-11 rounded-xl border border-white/10 text-slate-300 font-black text-xs uppercase tracking-wider hover:bg-white/5"
              >
                Cancelar
              </button>
              <SubmitButton pendingText="Cargando…" className="min-h-11 bg-rose-600 text-white hover:bg-rose-500">
                Borrar y cargar
              </SubmitButton>
            </div>
          </div>
        ) : wipe ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="w-full min-h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-slate-200 active:scale-95"
          >
            <Database size={16} /> Cargar plan del hogar
          </button>
        ) : (
          <SubmitButton pendingText="Cargando…" className="w-full min-h-12">
            <Database size={16} /> Cargar plan del hogar
          </SubmitButton>
        )}
      </form>
    </div>
  );
}

/** Aviso cuando falta correr la migración SQL en Supabase. */
export function SchemaMissingCard() {
  return (
    <div className="bg-amber-500/10 border border-amber-500/25 rounded-[2rem] p-6 space-y-2">
      <p className="flex items-center gap-2 text-sm font-black text-amber-300">
        <AlertTriangle size={16} /> Falta preparar la base de datos
      </p>
      <p className="text-sm text-slate-300">
        Abre Supabase → SQL Editor, pega el contenido de <code className="text-amber-200">supabase/schema-plan-hogar.sql</code> y
        ejecútalo. Después recarga esta pantalla.
      </p>
    </div>
  );
}
