'use client';

import { useActionState, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, Circle, Clock, X } from 'lucide-react';
import { deleteExpense, payCmrMonth } from '@/app/finanzas/plan/actions';
import { IDLE_STATE } from '@/lib/action';
import { formatCLP, shortDate } from '@/lib/format';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { ConfirmAction } from './confirm-action';
import { ExpenseSheet } from './expense-sheet';
import type { AccountItem, ExpensePreset, QuickData } from './types';

const METHODS = [
  { value: 'debito', label: 'Débito' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'otra_tarjeta', label: 'Otra tarjeta' },
];

function StateIcon({ state }: { state: AccountItem['state'] }) {
  if (state === 'pagado') return <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />;
  if (state === 'vencido') return <AlertCircle size={22} className="text-rose-400 shrink-0" />;
  if (state === 'vence_hoy') return <Clock size={22} className="text-amber-400 shrink-0" />;
  return <Circle size={22} className="text-slate-600 shrink-0" />;
}

function dueText(item: AccountItem): string {
  if (item.state === 'vencido') return item.dueDate ? `Venció el ${shortDate(item.dueDate)}` : 'Sin pagar';
  if (item.state === 'vence_hoy') return 'Vence hoy';
  return item.dueDate ? `Vence el ${shortDate(item.dueDate)}` : 'Este mes';
}

function Row({ item, onPay }: { item: AccountItem; onPay: (item: AccountItem) => void }) {
  const isIncome = item.kind === 'income';
  const paid = item.state === 'pagado';
  return (
    <li className={`flex items-center gap-3 rounded-2xl border pl-3 pr-2 py-2 ${
      item.state === 'vencido' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-black/20 border-white/5'
    }`}>
      <StateIcon state={item.state} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold truncate ${paid ? 'text-slate-400' : 'text-white'}`}>{item.label}</p>
        <p className={`text-[11px] font-medium truncate ${item.state === 'vencido' ? 'text-rose-300' : 'text-slate-500'}`}>
          {paid ? `${formatCLP(item.paid)} · ${item.paidInfo ?? ''}` : `${formatCLP(item.amount)} · ${dueText(item)}`}
        </p>
      </div>
      {paid ? (
        item.lastPaymentId && (
          <ConfirmAction
            action={deleteExpense}
            fields={{ id: item.lastPaymentId }}
            title={`¿Desmarcar "${item.label}"?`}
            message={`Se borra el registro de ${formatCLP(item.paid)} y vuelve a quedar ${isIncome ? 'por recibir' : 'por pagar'}.`}
            confirmLabel="Desmarcar"
            triggerTitle="Deshacer"
            triggerClassName="min-h-11 px-3 text-[11px] font-black text-slate-500 hover:text-white uppercase tracking-wider"
          >
            Deshacer
          </ConfirmAction>
        )
      ) : (
        <button
          type="button"
          onClick={() => onPay(item)}
          className={`min-h-11 px-4 rounded-xl font-black text-xs uppercase tracking-wider active:scale-95 transition-all ${
            isIncome ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-white text-black hover:bg-slate-200'
          }`}
        >
          {isIncome ? 'Recibí' : 'Pagar'}
        </button>
      )}
    </li>
  );
}

/** Pagar de una vez todas las cuotas CMR pendientes del mes. */
function BulkCmr({ month, lines, data }: { month: string; lines: AccountItem[]; data: QuickData }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(payCmrMonth, IDLE_STATE);
  const [paidBy, setPaidBy] = useState(data.me ?? '');
  const [method, setMethod] = useState('transferencia');
  const total = lines.reduce((a, l) => a + l.amount, 0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.ok) setOpen(false);
  }, [state]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full min-h-11 rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-200 text-xs font-black uppercase tracking-wider hover:bg-rose-500/15"
      >
        Pagar las {lines.length} cuotas CMR · {formatCLP(total)}
      </button>
    );
  }

  const chip = (active: boolean) =>
    `min-h-11 px-4 rounded-xl text-xs font-black border ${active ? 'bg-white text-black border-white' : 'bg-black/30 text-slate-400 border-white/10'}`;

  return (
    <form action={action} className="space-y-3 bg-black/30 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-white">Pagar cuotas CMR · {formatCLP(total)}</p>
        <button type="button" onClick={() => setOpen(false)} className="p-2 text-slate-500 hover:text-white" aria-label="Cerrar">
          <X size={18} />
        </button>
      </div>
      <InlineMessage state={state} />
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="paid_by" value={paidBy} />
      <input type="hidden" name="payment_method" value={method} />
      <input type="hidden" name="date" value={lines[0]?.payDate ?? data.today} />
      <div className="flex flex-wrap gap-2">
        {[...data.people, 'Ambos'].map((p) => (
          <button key={p} type="button" onClick={() => setPaidBy(p)} className={chip(paidBy === p)}>
            {p}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {METHODS.map((m) => (
          <button key={m.value} type="button" onClick={() => setMethod(m.value)} className={chip(method === m.value)}>
            {m.label}
          </button>
        ))}
      </div>
      <SubmitButton pendingText="Pagando…" className="w-full min-h-12 bg-rose-600 text-white hover:bg-rose-500">
        Confirmar pago de {lines.length} cuotas
      </SubmitButton>
    </form>
  );
}

/**
 * Cuentas del mes: lo que se paga o recibe una vez al mes. Un toque en
 * "Pagar" abre el registro con el monto y el concepto ya puestos.
 */
export function AccountsChecklist({
  items,
  data,
  month,
}: {
  items: AccountItem[];
  data: QuickData;
  month: string;
}) {
  const [paying, setPaying] = useState<ExpensePreset | null>(null);
  const [payingTitle, setPayingTitle] = useState('');
  const [showPaid, setShowPaid] = useState(false);

  const onPay = (item: AccountItem) => {
    setPayingTitle(item.kind === 'income' ? `Recibí ${item.label}` : `Pagar ${item.label}`);
    setPaying({
      kind: item.kind,
      concept_id: item.conceptId,
      debt_item_id: item.debtItemId,
      amount: item.amount > 0 ? item.amount : undefined,
      date: item.payDate,
      paid_by: item.person,
      label: item.debtItemId ? `CMR · ${item.label}` : item.label,
      lock: true,
    });
  };

  if (items.length === 0) return null;

  const pending = items.filter((i) => i.state !== 'pagado');
  const paid = items.filter((i) => i.state === 'pagado');
  const expenses = items.filter((i) => i.kind === 'expense');
  const paidExpenses = expenses.filter((i) => i.state === 'pagado').length;
  const toPay = pending.filter((i) => i.kind === 'expense').reduce((a, i) => a + i.amount, 0);
  const toReceive = pending.filter((i) => i.kind === 'income');
  const pendingExpenses = pending.filter((i) => i.kind === 'expense');
  const cmrPending = pendingExpenses.filter((i) => i.debtItemId);

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h2 className="text-[11px] font-black text-white uppercase tracking-[0.15em]">Cuentas del mes</h2>
        <span className="text-[11px] font-bold text-slate-400">
          {paidExpenses} de {expenses.length} pagadas{toPay > 0 && ` · faltan ${formatCLP(toPay)}`}
        </span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all"
          style={{ width: `${expenses.length ? (paidExpenses / expenses.length) * 100 : 0}%` }}
        />
      </div>

      {toReceive.length > 0 && (
        <ul className="space-y-2">
          {toReceive.map((i) => (
            <Row key={i.key} item={i} onPay={onPay} />
          ))}
        </ul>
      )}

      {pendingExpenses.length > 0 ? (
        <ul className="space-y-2">
          {pendingExpenses.map((i) => (
            <Row key={i.key} item={i} onPay={onPay} />
          ))}
        </ul>
      ) : (
        <p className="text-sm font-bold text-emerald-300 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
          ✓ Todas las cuentas del mes están pagadas
        </p>
      )}

      {cmrPending.length >= 2 && <BulkCmr month={month} lines={cmrPending} data={data} />}

      {paid.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowPaid((v) => !v)}
            className="w-full min-h-11 inline-flex items-center justify-center gap-1.5 text-[11px] font-black text-slate-500 uppercase tracking-wider hover:text-white"
          >
            {showPaid ? 'Ocultar' : 'Ver'} pagadas y recibidas ({paid.length})
            <ChevronDown size={14} className={`transition-transform ${showPaid ? 'rotate-180' : ''}`} />
          </button>
          {showPaid && (
            <ul className="space-y-2">
              {paid.map((i) => (
                <Row key={i.key} item={i} onPay={onPay} />
              ))}
            </ul>
          )}
        </>
      )}

      <ExpenseSheet
        key={paying ? `${paying.concept_id}:${paying.debt_item_id ?? ''}` : 'none'}
        open={paying !== null}
        onClose={() => setPaying(null)}
        data={data}
        preset={paying ?? undefined}
        title={payingTitle}
      />
    </section>
  );
}
