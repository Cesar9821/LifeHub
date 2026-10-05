'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { Archive, Pencil, Settings2 } from 'lucide-react';
import { setBudgetAmount, setConceptArchived, updateConcept } from '@/app/(app)/finanzas/plan/actions';
import { IDLE_STATE } from '@/lib/action';
import { formatCLP } from '@/lib/format';
import type { BudgetStatus } from '@/lib/plan/budget';
import type { ChecklistState } from '@/lib/plan/checklist';
import { CLPInput } from '@/components/ui/clp-input';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { fieldBase } from '@/components/ui/styles';
import { NumberInput } from '@/components/ui/number-input';
import { ConfirmAction } from '@/components/finanzas/confirm-action';
import { StatusChip, UsageBar } from '@/components/finanzas/status-chip';

interface Props {
  conceptId: string;
  name: string;
  group: string;
  month: string;
  budget: number;
  /** Gastado (gastos) o registrado (ingresos). */
  actual: number;
  kind: 'income' | 'expense';
  status?: BudgetStatus;
  used?: number;
  isDebtPlan?: boolean;
  person?: string | null;
  payMode: 'cuenta' | 'bolsa';
  dueDay: number | null;
  payState: ChecklistState | null;
}

const PAY_CHIP: Record<ChecklistState, { label: string; cls: string }> = {
  pagado: { label: 'Pagado ✓', cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' },
  por_pagar: { label: 'Por pagar', cls: 'bg-white/5 text-ink-2 border-white/15' },
  vence_hoy: { label: 'Vence hoy', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  vencido: { label: 'Vencido', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
};

function AmountForm({ conceptId, month, budget, onDone }: { conceptId: string; month: string; budget: number; onDone: () => void }) {
  const [state, action] = useActionState(setBudgetAmount, IDLE_STATE);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);
  return (
    <form action={action} className="space-y-3 pt-3">
      <input type="hidden" name="concept_id" value={conceptId} />
      <input type="hidden" name="month" value={month} />
      <InlineMessage state={state} />
      <CLPInput name="amount" defaultValue={budget} autoFocus placeholder="0" />
      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 min-h-11 px-3 rounded-xl border border-line-strong text-xs font-bold text-ink-2 cursor-pointer has-[:checked]:border-indigo-400 has-[:checked]:text-ink">
          <input type="radio" name="scope" value="month" defaultChecked className="accent-indigo-500" /> Solo este mes
        </label>
        <label className="flex items-center gap-2 min-h-11 px-3 rounded-xl border border-line-strong text-xs font-bold text-ink-2 cursor-pointer has-[:checked]:border-indigo-400 has-[:checked]:text-ink">
          <input type="radio" name="scope" value="forward" className="accent-indigo-500" /> De aquí en adelante
        </label>
      </div>
      <div className="flex gap-2">
        <SubmitButton pendingText="Guardando…" className="flex-1 min-h-11">Guardar</SubmitButton>
        <button type="button" onClick={onDone} className="min-h-11 px-4 text-xs font-bold text-ink-3 hover:text-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function EditForm({
  conceptId,
  name,
  group,
  payMode,
  dueDay,
  onDone,
}: {
  conceptId: string;
  name: string;
  group: string;
  payMode: 'cuenta' | 'bolsa';
  dueDay: number | null;
  onDone: () => void;
}) {
  const [state, action] = useActionState(updateConcept, IDLE_STATE);
  const [mode, setMode] = useState(payMode);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);
  return (
    <form action={action} className="space-y-3 pt-3">
      <input type="hidden" name="id" value={conceptId} />
      <InlineMessage state={state} />
      <div className="grid grid-cols-2 gap-2">
        <input name="name" defaultValue={name} required className={`${fieldBase} min-h-11`} placeholder="Nombre" />
        <input name="group_name" defaultValue={group} required className={`${fieldBase} min-h-11`} placeholder="Grupo" />
      </div>
      <input type="hidden" name="pay_mode" value={mode} />
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ['cuenta', 'Cuenta del mes', 'Se paga una vez'],
            ['bolsa', 'Gasto variable', 'Varias compras'],
          ] as const
        ).map(([value, label, hint]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`min-h-12 rounded-xl border px-3 py-2 text-left ${
              mode === value ? 'border-indigo-400 bg-indigo-500/10' : 'border-line-strong'
            }`}
          >
            <span className="block text-xs font-semibold text-ink">{label}</span>
            <span className="block text-xs text-ink-3">{hint}</span>
          </button>
        ))}
      </div>
      {mode === 'cuenta' && (
        <label className="flex items-center gap-3 text-xs font-bold text-ink-2">
          Vence el día
          <div className="w-24">
            <NumberInput name="due_day" defaultValue={dueDay ?? ''} placeholder="—" />
          </div>
          <span className="text-ink-3">(opcional)</span>
        </label>
      )}
      {state.fieldErrors?.due_day && <p className="text-xs font-bold text-rose-400">{state.fieldErrors.due_day}</p>}
      <div className="flex gap-2">
        <SubmitButton pendingText="Guardando…" className="flex-1 min-h-11">Guardar</SubmitButton>
        <button type="button" onClick={onDone} className="min-h-11 px-4 text-xs font-bold text-ink-3 hover:text-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function BudgetRow(p: Props) {
  const [mode, setMode] = useState<'view' | 'amount' | 'edit'>('view');
  const close = () => setMode('view');
  const isIncome = p.kind === 'income';
  const remaining = p.budget - p.actual;

  return (
    <div className="bg-black/20 border border-line rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-bold text-ink truncate">{p.name}</p>
          <p className="text-xs font-medium text-ink-3">
            {isIncome ? (
              <>
                Presupuesto {formatCLP(p.budget)}
                {p.actual > 0 && <> · registrado {formatCLP(p.actual)}</>}
                {p.person && <> · {p.person}</>}
                {p.dueDay && <> · día {p.dueDay}</>}
              </>
            ) : (
              <>
                {formatCLP(p.actual)} de {formatCLP(p.budget)}
                {p.payMode === 'cuenta' && p.dueDay && <> · vence día {p.dueDay}</>}
                {p.budget > 0 && (
                  <>
                    {' · '}
                    <span className={remaining < 0 ? 'text-rose-400' : ''}>
                      {remaining < 0 ? `pasado ${formatCLP(-remaining)}` : `quedan ${formatCLP(remaining)}`}
                    </span>
                  </>
                )}
              </>
            )}
          </p>
        </div>
        {p.payState && p.status !== 'pasado' ? (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold tracking-wide whitespace-nowrap ${PAY_CHIP[p.payState].cls}`}>
            {isIncome ? (p.payState === 'pagado' ? 'Recibido ✓' : 'Por recibir') : PAY_CHIP[p.payState].label}
          </span>
        ) : (
          p.status && <StatusChip status={p.status} />
        )}
      </div>

      {!isIncome && p.status && (
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1">
            <UsageBar used={p.used ?? 0} status={p.status} />
          </div>
          <span className="text-xs font-semibold text-ink-3 w-10 text-right">
            {p.budget > 0 ? `${Math.round((p.used ?? 0) * 100)}%` : '—'}
          </span>
        </div>
      )}

      {mode === 'view' && (
        <div className="mt-2 flex items-center gap-1 -mb-2 -ml-2">
          {p.isDebtPlan ? (
            <Link href="/finanzas/credits" className="min-h-11 inline-flex items-center px-2 text-xs font-semibold text-indigo-400 tracking-wide">
              Calculado por el plan CMR →
            </Link>
          ) : (
            <button type="button" onClick={() => setMode('amount')} className="min-h-11 inline-flex items-center gap-1.5 px-2 text-xs font-semibold text-ink-2 hover:text-ink tracking-wide">
              <Pencil size={13} /> Monto
            </button>
          )}
          <button type="button" onClick={() => setMode('edit')} className="min-h-11 inline-flex items-center gap-1.5 px-2 text-xs font-semibold text-ink-2 hover:text-ink tracking-wide">
            <Settings2 size={13} /> Editar
          </button>
          {!p.isDebtPlan && (
            <ConfirmAction
              action={setConceptArchived}
              fields={{ id: p.conceptId, archived: 'true' }}
              title={`¿Archivar "${p.name}"?`}
              message="Deja de aparecer en el presupuesto y en el registro rápido. Sus gastos se conservan y puedes restaurarlo después."
              confirmLabel="Archivar"
              triggerClassName="min-h-11 inline-flex items-center gap-1.5 px-2 text-xs font-semibold text-ink-3 hover:text-rose-400 tracking-wide"
            >
              <Archive size={13} /> Archivar
            </ConfirmAction>
          )}
        </div>
      )}

      {mode === 'amount' && <AmountForm conceptId={p.conceptId} month={p.month} budget={p.budget} onDone={close} />}
      {mode === 'edit' && (
        <EditForm
          conceptId={p.conceptId}
          name={p.name}
          group={p.group}
          payMode={p.payMode}
          dueDay={p.dueDay}
          onDone={close}
        />
      )}
    </div>
  );
}
