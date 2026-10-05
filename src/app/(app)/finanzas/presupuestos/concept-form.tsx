'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { addConcept } from '@/app/(app)/finanzas/plan/actions';
import { IDLE_STATE } from '@/lib/action';
import { CLPInput } from '@/components/ui/clp-input';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { fieldBase } from '@/components/ui/styles';
import { NumberInput } from '@/components/ui/number-input';

/** Agregar un concepto nuevo; su monto aplica desde el mes elegido en adelante. */
export default function ConceptForm({
  month,
  groups,
  people,
}: {
  month: string;
  groups: string[];
  people: string[];
}) {
  const [state, action] = useActionState(addConcept, IDLE_STATE);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<'income' | 'expense'>('expense');
  const [payMode, setPayMode] = useState<'cuenta' | 'bolsa'>('bolsa');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full min-h-12 inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 text-xs font-semibold text-ink-2 tracking-wide hover:text-ink hover:border-white/30"
      >
        <Plus size={16} /> Agregar concepto
      </button>
    );
  }

  return (
    <form ref={formRef} action={action} className="bg-surface border border-line rounded-3xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-ink tracking-wide">Nuevo concepto</h3>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="pay_mode" value={payMode} />
      <InlineMessage state={state} />

      <div className="grid grid-cols-2 gap-2 p-1 bg-black/30 rounded-2xl border border-line">
        {(['expense', 'income'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`min-h-11 rounded-xl text-xs font-semibold tracking-wide ${kind === k ? 'bg-white text-black' : 'text-ink-3'}`}
          >
            {k === 'expense' ? 'Gasto' : 'Ingreso'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input name="name" required placeholder="Nombre (ej: Mascotas)" defaultValue={state.values?.name ?? ''} className={`${fieldBase} min-h-11`} />
        <input
          name="group_name"
          required
          list="concept-groups"
          placeholder="Grupo (ej: Hogar y personal)"
          defaultValue={state.values?.group_name ?? (kind === 'income' ? 'Ingresos' : '')}
          className={`${fieldBase} min-h-11`}
        />
        <datalist id="concept-groups">
          {groups.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
        {kind === 'income' && (
          <select name="person" defaultValue="" className={`${fieldBase} min-h-11 appearance-none`}>
            <option value="" className="bg-surface">Sin persona (no cuenta para el aporte)</option>
            {people.map((p) => (
              <option key={p} value={p} className="bg-surface">
                Sueldo de {p}
              </option>
            ))}
          </select>
        )}
        <CLPInput name="amount" placeholder="Monto mensual" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ['cuenta', 'Cuenta del mes', 'Se paga una vez (arriendo, luz)'],
            ['bolsa', 'Gasto variable', 'Varias compras (súper, ocio)'],
          ] as const
        ).map(([value, label, hint]) => (
          <button
            key={value}
            type="button"
            onClick={() => setPayMode(value)}
            className={`min-h-12 rounded-xl border px-3 py-2 text-left ${
              payMode === value ? 'border-indigo-400 bg-indigo-500/10' : 'border-line-strong'
            }`}
          >
            <span className="block text-xs font-semibold text-ink">{label}</span>
            <span className="block text-xs text-ink-3">{hint}</span>
          </button>
        ))}
      </div>
      {payMode === 'cuenta' && (
        <label className="flex items-center gap-3 text-xs font-bold text-ink-2">
          Vence el día
          <div className="w-24">
            <NumberInput name="due_day" placeholder="—" />
          </div>
          <span className="text-ink-3">(opcional)</span>
        </label>
      )}
      <p className="text-xs text-ink-3">El monto se aplica desde este mes hasta el final del plan.</p>

      <div className="flex gap-2">
        <SubmitButton pendingText="Agregando…" className="flex-1 min-h-11">
          <Plus size={15} /> Agregar
        </SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 px-4 text-xs font-bold text-ink-3 hover:text-ink">
          Cerrar
        </button>
      </div>
    </form>
  );
}
