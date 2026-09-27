'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { saveExpense } from '@/app/finanzas/plan/actions';
import { IDLE_STATE } from '@/lib/action';
import { CLPInput } from '@/components/ui/clp-input';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { fieldBase } from '@/components/ui/styles';
import type { ExpenseInitial, QuickData } from './types';

const METHODS = [
  { value: 'debito', label: 'Débito' },
  { value: 'credito_cmr', label: 'Crédito CMR' },
  { value: 'otra_tarjeta', label: 'Otra tarjeta' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
];

function Chips({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`min-h-11 px-4 rounded-xl text-xs font-black transition-all active:scale-95 border ${
            value === o.value
              ? 'bg-white text-black border-white'
              : 'bg-black/30 text-slate-400 border-white/10 hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{children}</p>;
}

/** Formulario de registro/edición de un gasto o ingreso (monto, concepto, quién, medio, fecha). */
export function ExpenseForm({
  data,
  initial,
  onDone,
}: {
  data: QuickData;
  initial?: ExpenseInitial;
  onDone: () => void;
}) {
  const [state, formAction] = useActionState(saveExpense, IDLE_STATE);
  const [kind, setKind] = useState<'income' | 'expense'>(initial?.kind ?? 'expense');
  const [conceptId, setConceptId] = useState(initial?.concept_id ?? '');
  const [paidBy, setPaidBy] = useState(initial?.paid_by ?? data.me ?? '');
  const [method, setMethod] = useState(initial?.payment_method ?? 'debito');

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  const concepts = useMemo(
    () => data.concepts.filter((c) => c.kind === kind),
    [data.concepts, kind]
  );
  const groups = useMemo(() => {
    const map = new Map<string, typeof concepts>();
    for (const c of concepts) {
      if (!map.has(c.group_name)) map.set(c.group_name, []);
      map.get(c.group_name)!.push(c);
    }
    return [...map.entries()];
  }, [concepts]);

  const selected = data.concepts.find((c) => c.id === conceptId);
  const isExpense = kind === 'expense';
  const err = state.fieldErrors ?? {};

  const pickConcept = (id: string) => {
    setConceptId(id);
    // Las cuotas del plan casa se pagan con la CMR.
    if (data.concepts.find((c) => c.id === id)?.is_debt_plan) setMethod('credito_cmr');
  };

  return (
    <form action={formAction} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="concept_id" value={conceptId} />
      <input type="hidden" name="paid_by" value={paidBy} />
      {isExpense && <input type="hidden" name="payment_method" value={method} />}

      {!initial && (
        <div className="grid grid-cols-2 gap-2 p-1 bg-black/30 rounded-2xl border border-white/5">
          {(['expense', 'income'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k);
                setConceptId('');
              }}
              className={`min-h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                kind === k
                  ? k === 'expense'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                  : 'text-slate-500'
              }`}
            >
              {k === 'expense' ? 'Gasto' : 'Ingreso'}
            </button>
          ))}
        </div>
      )}

      <InlineMessage state={state} />

      <div className="space-y-1.5">
        <Label>Monto</Label>
        <CLPInput
          name="amount"
          required
          autoFocus={!initial}
          defaultValue={initial?.amount ?? state.values?.amount ?? ''}
          placeholder="0"
          accent={isExpense ? 'indigo' : 'emerald'}
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-4 text-3xl font-black text-white placeholder:text-slate-700 outline-none focus:ring-2 focus:ring-white/15"
        />
        {err.amount && <p className="text-[11px] font-bold text-rose-400 px-1">{err.amount}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Concepto</Label>
        <select
          value={conceptId}
          onChange={(e) => pickConcept(e.target.value)}
          className={`${fieldBase} min-h-11 appearance-none ${err.concept_id ? 'border-rose-500/50' : ''}`}
        >
          <option value="" className="bg-[#0A0C10]">Elige un concepto…</option>
          {groups.map(([group, items]) => (
            <optgroup key={group} label={group} className="bg-[#0A0C10]">
              {items.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0A0C10]">
                  {c.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {err.concept_id && <p className="text-[11px] font-bold text-rose-400 px-1">{err.concept_id}</p>}
      </div>

      {selected?.is_debt_plan && (
        <div className="space-y-1.5">
          <Label>Ítem de la deuda</Label>
          <select
            name="debt_item_id"
            defaultValue={initial?.debt_item_id ?? ''}
            className={`${fieldBase} min-h-11 appearance-none ${err.debt_item_id ? 'border-rose-500/50' : ''}`}
          >
            <option value="" className="bg-[#0A0C10]">¿Qué cuota pagaste?</option>
            {data.debtItems.map((d) => (
              <option key={d.id} value={d.id} className="bg-[#0A0C10]">
                {d.name}
              </option>
            ))}
          </select>
          {err.debt_item_id && <p className="text-[11px] font-bold text-rose-400 px-1">{err.debt_item_id}</p>}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>{isExpense ? 'Quién pagó' : 'De quién'}</Label>
        <Chips
          options={[...data.people, 'Ambos'].map((p) => ({ value: p, label: p }))}
          value={paidBy}
          onChange={setPaidBy}
        />
      </div>

      {isExpense && (
        <div className="space-y-1.5">
          <Label>Medio de pago</Label>
          <Chips options={METHODS} value={method} onChange={setMethod} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Fecha</Label>
          <input
            type="date"
            name="date"
            required
            defaultValue={initial?.date ?? data.today}
            className={`${fieldBase} min-h-11`}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Detalle (opcional)</Label>
          <input
            name="detail"
            defaultValue={initial?.detail ?? ''}
            placeholder="Ej: Líder"
            className={`${fieldBase} min-h-11`}
          />
        </div>
      </div>

      <SubmitButton
        pendingText="Guardando…"
        className={`w-full min-h-12 text-sm text-white ${
          isExpense ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
        }`}
      >
        {initial ? 'Guardar cambios' : isExpense ? 'Registrar gasto' : 'Registrar ingreso'}
      </SubmitButton>
    </form>
  );
}

/** Hoja inferior (bottom sheet) que contiene el formulario. */
export function ExpenseSheet({
  open,
  onClose,
  data,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  data: QuickData;
  initial?: ExpenseInitial;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-[#0F1117] border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-white uppercase tracking-wider">
            {initial ? 'Editar movimiento' : 'Registro rápido'}
          </h2>
          <button type="button" onClick={onClose} className="p-2.5 text-slate-500 hover:text-white" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <ExpenseForm data={data} initial={initial} onDone={onClose} />
      </div>
    </div>
  );
}

/** Botón flotante "+ Gasto" que abre el registro rápido. */
export function QuickExpenseFab({ data }: { data: QuickData }) {
  const [open, setOpen] = useState(false);
  if (data.concepts.length === 0) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed z-[55] right-5 bottom-[max(1.5rem,env(safe-area-inset-bottom))] flex items-center gap-2 min-h-14 pl-5 pr-6 rounded-full bg-rose-600 text-white font-black text-sm uppercase tracking-wider shadow-[0_12px_30px_-8px_rgba(225,29,72,0.7)] hover:bg-rose-500 active:scale-95 transition-all"
      >
        <Plus size={20} strokeWidth={3} /> Gasto
      </button>
      <ExpenseSheet open={open} onClose={() => setOpen(false)} data={data} />
    </>
  );
}
