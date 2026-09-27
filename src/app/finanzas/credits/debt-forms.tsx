'use client';

import { useActionState, useEffect, useState } from 'react';
import { Archive, Pencil, Plus } from 'lucide-react';
import { archiveDebtItem, saveCmrSettings, saveDebtItem } from '@/app/finanzas/plan/actions';
import { IDLE_STATE } from '@/lib/action';
import { formatCLP } from '@/lib/format';
import { CLPInput } from '@/components/ui/clp-input';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { fieldBase } from '@/components/ui/styles';
import { ConfirmAction } from '@/components/finanzas/confirm-action';

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{children}</span>;
}

/** Pago fijo mensual y mes de inicio del plan. */
export function CmrSettingsForm({
  fixedPayment,
  startMonth,
  months,
}: {
  fixedPayment: number;
  startMonth: string;
  months: { value: string; label: string }[];
}) {
  const [state, action] = useActionState(saveCmrSettings, IDLE_STATE);
  return (
    <form action={action} className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-5 space-y-4">
      <h2 className="text-sm font-black text-white uppercase tracking-wider">Parámetros del plan</h2>
      <InlineMessage state={state} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="space-y-1.5">
          <Label>Pago fijo mensual</Label>
          <CLPInput name="cmr_fixed_payment" defaultValue={fixedPayment} required />
        </label>
        <label className="space-y-1.5 flex flex-col">
          <Label>Mes de inicio</Label>
          <select name="cmr_start_month" defaultValue={startMonth} className={`${fieldBase} min-h-11 appearance-none`}>
            {months.map((m) => (
              <option key={m.value} value={m.value} className="bg-[#0A0C10]">
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-[11px] text-slate-500">
        Paga siempre el total facturado de la CMR, nunca el mínimo. Lo que sobra después de las cuotas adelanta ítems por prioridad.
      </p>
      <SubmitButton pendingText="Recalculando…" className="w-full min-h-11">
        Recalcular plan
      </SubmitButton>
    </form>
  );
}

export interface DebtItemFields {
  id?: string;
  name: string;
  price: number;
  installment: number;
  total_installments: number;
  remaining_installments: number;
  priority: number;
}

function DebtItemForm({ initial, onDone }: { initial?: DebtItemFields; onDone: () => void }) {
  const [state, action] = useActionState(saveDebtItem, IDLE_STATE);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);
  const err = state.fieldErrors ?? {};
  const num = (name: keyof DebtItemFields, label: string, value?: number) => (
    <label className="space-y-1.5 flex flex-col">
      <Label>{label}</Label>
      <input
        name={name}
        type="number"
        inputMode="numeric"
        min={0}
        required
        defaultValue={value ?? ''}
        className={`${fieldBase} min-h-11 ${err[name] ? 'border-rose-500/50' : ''}`}
      />
      {err[name] && <span className="text-[11px] font-bold text-rose-400 px-1">{err[name]}</span>}
    </label>
  );

  return (
    <form action={action} className="space-y-3 pt-3">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <InlineMessage state={state} />
      <label className="space-y-1.5 flex flex-col">
        <Label>Ítem</Label>
        <input name="name" required defaultValue={initial?.name ?? ''} placeholder="Ej: Refrigerador" className={`${fieldBase} min-h-11`} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1.5 flex flex-col">
          <Label>Precio</Label>
          <CLPInput name="price" defaultValue={initial?.price ?? ''} />
        </label>
        <label className="space-y-1.5 flex flex-col">
          <Label>Cuota</Label>
          <input
            name="installment"
            inputMode="decimal"
            required
            defaultValue={initial ? String(initial.installment).replace('.', ',') : ''}
            className={`${fieldBase} min-h-11`}
          />
        </label>
        {num('total_installments', 'Cuotas totales', initial?.total_installments)}
        {num('remaining_installments', 'Cuotas que quedan', initial?.remaining_installments)}
        {num('priority', 'Prioridad (1 = primero)', initial?.priority)}
      </div>
      <div className="flex gap-2">
        <SubmitButton pendingText="Guardando…" className="flex-1 min-h-11">
          Guardar
        </SubmitButton>
        <button type="button" onClick={onDone} className="min-h-11 px-4 text-xs font-bold text-slate-500 hover:text-white">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function AddDebtItem({ nextPriority }: { nextPriority: number }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full min-h-12 inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 text-xs font-black text-slate-400 uppercase tracking-wider hover:text-white hover:border-white/30"
      >
        <Plus size={16} /> Agregar compra en cuotas
      </button>
    );
  }
  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-5">
      <h3 className="text-sm font-black text-white uppercase tracking-wider">Nueva compra en cuotas</h3>
      <DebtItemForm
        initial={{ name: '', price: 0, installment: 0, total_installments: 0, remaining_installments: 0, priority: nextPriority }}
        onDone={() => setOpen(false)}
      />
    </div>
  );
}

export function DebtItemCard({
  item,
  color,
  balance,
  paid,
  remainingInstallments,
  interest,
  status,
  thisMonth,
}: {
  item: DebtItemFields & { id: string };
  color: string;
  balance: number;
  paid: number;
  remainingInstallments: number;
  interest: number;
  status: 'Pagado' | 'Pendiente' | 'Completar';
  thisMonth: { installment: number; advance: number; total: number };
}) {
  const [editing, setEditing] = useState(false);
  const statusCls =
    status === 'Pagado'
      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
      : status === 'Completar'
      ? 'bg-violet-500/10 text-violet-300 border-violet-500/25'
      : 'bg-amber-500/10 text-amber-300 border-amber-500/25';

  return (
    <div className="bg-black/20 border border-white/5 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
          <p className="text-sm font-bold text-white truncate">{item.name}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${statusCls}`}>{status}</span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
        <div>
          <dt className="text-slate-500 font-bold">Saldo</dt>
          <dd className="text-white font-black font-mono text-sm">{formatCLP(balance)}</dd>
        </div>
        <div>
          <dt className="text-slate-500 font-bold">Cuotas que quedan</dt>
          <dd className="text-white font-black text-sm">
            {remainingInstallments} <span className="text-slate-500 font-bold">de {formatCLP(item.installment)}</span>
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 font-bold">Prioridad</dt>
          <dd className="text-white font-black text-sm">{item.priority}</dd>
        </div>
        <div>
          <dt className="text-slate-500 font-bold">Interés</dt>
          <dd className={`font-black text-sm ${interest > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
            {interest > 0 ? `Sí · ${formatCLP(interest)}` : 'No'}
          </dd>
        </div>
      </dl>

      {(thisMonth.total > 0 || paid > 0) && (
        <p className="mt-3 text-[11px] font-bold text-slate-400">
          Este mes: {formatCLP(thisMonth.installment)} cuota
          {thisMonth.advance > 0 && <span className="text-amber-300"> + {formatCLP(thisMonth.advance)} adelanto</span>}
          {paid > 0 && <span className="text-slate-500"> · pagado en total {formatCLP(paid)}</span>}
        </p>
      )}

      {!editing ? (
        <div className="mt-2 flex items-center gap-1 -mb-2 -ml-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="min-h-11 inline-flex items-center gap-1.5 px-2 text-[11px] font-black text-slate-400 hover:text-white uppercase tracking-wider"
          >
            <Pencil size={13} /> Editar
          </button>
          <ConfirmAction
            action={archiveDebtItem}
            fields={{ id: item.id }}
            title={`¿Archivar "${item.name}"?`}
            message="Sale del plan CMR. Los pagos registrados se conservan."
            confirmLabel="Archivar"
            triggerClassName="min-h-11 inline-flex items-center gap-1.5 px-2 text-[11px] font-black text-slate-500 hover:text-rose-400 uppercase tracking-wider"
          >
            <Archive size={13} /> Archivar
          </ConfirmAction>
        </div>
      ) : (
        <DebtItemForm initial={item} onDone={() => setEditing(false)} />
      )}
    </div>
  );
}
