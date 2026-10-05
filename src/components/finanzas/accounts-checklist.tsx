'use client';

import { useActionState, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, Circle, Clock, X } from 'lucide-react';
import Link from 'next/link';
import { deleteExpense, payCmrMonth, undoCmrMonth } from '@/app/finanzas/plan/actions';
import { IDLE_STATE } from '@/lib/action';
import { formatCLP, shortDate } from '@/lib/format';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { toast } from '@/components/ui/toast';
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
  return <Circle size={22} className="text-ink-3 shrink-0" />;
}

function dueText(item: AccountItem): string {
  if (item.state === 'vencido') return item.dueDate ? `Venció el ${shortDate(item.dueDate)}` : 'Sin pagar';
  if (item.state === 'vence_hoy') return 'Vence hoy';
  return item.dueDate ? `Vence el ${shortDate(item.dueDate)}` : 'Este mes';
}

function subtitle(item: AccountItem): string {
  const paid = item.state === 'pagado';
  if (item.isCmr) {
    const cuotas = `${item.cmrLines} cuota${item.cmrLines === 1 ? '' : 's'}`;
    if (paid) return `${formatCLP(item.paid)} · ${item.paidInfo ?? ''}`;
    if (item.paid > 0) return `Faltan ${formatCLP(item.pendingAmount ?? 0)} de ${formatCLP(item.amount)} · ${dueText(item)}`;
    return `${formatCLP(item.amount)} · ${cuotas} · ${dueText(item)}`;
  }
  return paid ? `${formatCLP(item.paid)} · ${item.paidInfo ?? ''}` : `${formatCLP(item.amount)} · ${dueText(item)}`;
}

function Row({ item, onPay, month }: { item: AccountItem; onPay: (item: AccountItem) => void; month: string }) {
  const isIncome = item.kind === 'income';
  const paid = item.state === 'pagado';
  return (
    <li className={`flex items-center gap-3 rounded-2xl border pl-3 pr-2 py-2 ${
      item.state === 'vencido' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-black/20 border-line'
    }`}>
      <StateIcon state={item.state} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold truncate ${paid ? 'text-ink-2' : 'text-ink'}`}>{item.label}</p>
        <p className={`text-xs font-medium truncate ${item.state === 'vencido' ? 'text-rose-300' : 'text-ink-3'}`}>
          {subtitle(item)}
        </p>
      </div>
      {paid && item.isCmr ? (
        <ConfirmAction
          action={undoCmrMonth}
          fields={{ month }}
          title="¿Desmarcar la Deuda CMR del mes?"
          message={`Se borran los pagos de cuotas CMR de este mes (${formatCLP(item.paid)}) y vuelve a quedar por pagar.`}
          confirmLabel="Desmarcar"
          triggerTitle="Deshacer"
          triggerClassName="min-h-11 px-3 text-xs font-semibold text-ink-3 hover:text-ink tracking-wide"
        >
          Deshacer
        </ConfirmAction>
      ) : paid ? (
        item.lastPaymentId && (
          <ConfirmAction
            action={deleteExpense}
            fields={{ id: item.lastPaymentId }}
            title={`¿Desmarcar "${item.label}"?`}
            message={`Se borra el registro de ${formatCLP(item.paid)} y vuelve a quedar ${isIncome ? 'por recibir' : 'por pagar'}.`}
            confirmLabel="Desmarcar"
            triggerTitle="Deshacer"
            triggerClassName="min-h-11 px-3 text-xs font-semibold text-ink-3 hover:text-ink tracking-wide"
          >
            Deshacer
          </ConfirmAction>
        )
      ) : (
        <button
          type="button"
          onClick={() => onPay(item)}
          className={`min-h-11 px-4 rounded-xl font-semibold text-xs tracking-wide active:scale-95 transition-all ${
            isIncome ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-white text-black hover:bg-slate-200'
          }`}
        >
          {isIncome ? 'Recibí' : 'Pagar'}
        </button>
      )}
    </li>
  );
}

/** Hoja para pagar la Deuda CMR del mes: todas las cuotas pendientes de una vez. */
function CmrPaySheet({
  item,
  month,
  data,
  onClose,
}: {
  item: AccountItem;
  month: string;
  data: QuickData;
  onClose: () => void;
}) {
  const [state, action] = useActionState(payCmrMonth, IDLE_STATE);
  const [paidBy, setPaidBy] = useState(data.me ?? '');
  const [method, setMethod] = useState('transferencia');
  const total = item.pendingAmount ?? item.amount;

  useEffect(() => {
    if (state.ok) {
      if (state.message) toast(state.message);
      onClose();
    }
  }, [state, onClose]);

  const chip = (active: boolean) =>
    `min-h-11 px-4 rounded-xl text-xs font-semibold border ${active ? 'bg-white text-black border-white' : 'bg-black/30 text-ink-2 border-line-strong'}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <form
        action={action}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md space-y-4 bg-surface-2 border border-line-strong rounded-t-3xl sm:rounded-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink tracking-wide">Pagar Deuda CMR</h2>
          <button type="button" onClick={onClose} className="p-2.5 text-ink-3 hover:text-ink" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="bg-black/30 border border-line-strong rounded-2xl p-4">
          <p className="text-3xl font-semibold tabular-nums text-ink">{formatCLP(total)}</p>
          <p className="mt-1 text-xs font-bold text-ink-2">
            {item.cmrLines} cuota{item.cmrLines === 1 ? '' : 's'} del plan (cuota + adelanto).{' '}
            <Link href="/finanzas/credits" className="text-indigo-400">Ver detalle</Link>
          </p>
        </div>
        <InlineMessage state={state} />
        <input type="hidden" name="month" value={month} />
        <input type="hidden" name="paid_by" value={paidBy} />
        <input type="hidden" name="payment_method" value={method} />
        <input type="hidden" name="date" value={item.payDate} />
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-ink-3 tracking-wide px-1">Quién pagó</p>
          <div className="flex flex-wrap gap-2">
            {[...data.people, 'Ambos'].map((p) => (
              <button key={p} type="button" onClick={() => setPaidBy(p)} className={chip(paidBy === p)}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-ink-3 tracking-wide px-1">Medio de pago</p>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <button key={m.value} type="button" onClick={() => setMethod(m.value)} className={chip(method === m.value)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <SubmitButton pendingText="Pagando…" className="w-full min-h-12 bg-rose-600 text-ink hover:bg-rose-500">
          Confirmar pago
        </SubmitButton>
      </form>
    </div>
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
  const [payingCmr, setPayingCmr] = useState<AccountItem | null>(null);

  const onPay = (item: AccountItem) => {
    if (item.isCmr) {
      setPayingCmr(item);
      return;
    }
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

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h2 className="text-xs font-semibold text-ink tracking-wide">Cuentas del mes</h2>
        <span className="text-xs font-bold text-ink-2">
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
            <Row key={i.key} item={i} onPay={onPay} month={month} />
          ))}
        </ul>
      )}

      {pendingExpenses.length > 0 ? (
        <ul className="space-y-2">
          {pendingExpenses.map((i) => (
            <Row key={i.key} item={i} onPay={onPay} month={month} />
          ))}
        </ul>
      ) : (
        <p className="text-sm font-bold text-emerald-300 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
          ✓ Todas las cuentas del mes están pagadas
        </p>
      )}

      {paid.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowPaid((v) => !v)}
            className="w-full min-h-11 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-3 tracking-wide hover:text-ink"
          >
            {showPaid ? 'Ocultar' : 'Ver'} pagadas y recibidas ({paid.length})
            <ChevronDown size={14} className={`transition-transform ${showPaid ? 'rotate-180' : ''}`} />
          </button>
          {showPaid && (
            <ul className="space-y-2">
              {paid.map((i) => (
                <Row key={i.key} item={i} onPay={onPay} month={month} />
              ))}
            </ul>
          )}
        </>
      )}

      {payingCmr && <CmrPaySheet item={payingCmr} month={month} data={data} onClose={() => setPayingCmr(null)} />}

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
