import { Database } from 'lucide-react';

/** Aviso cuando falta ejecutar el SQL de planificación en Supabase. */
export function PlanningSetupCard() {
  return (
    <div className="rounded-3xl border border-warning/30 bg-warning/5 p-5 space-y-2">
      <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <Database size={18} className="text-warning" /> Falta un paso para activar la planificación
      </p>
      <p className="text-sm text-ink-2">
        En Supabase → SQL Editor, ejecuta <code className="text-ink">supabase/20261005_lifehub_planning.sql</code>. Es
        aditivo: no borra nada. Mientras tanto, Finanzas, Hábitos y Hogar funcionan igual.
      </p>
    </div>
  );
}
