'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteExpense } from '@/app/finanzas/plan/actions';
import { formatCLP, shortDate } from '@/lib/format';
import { ConfirmAction } from './confirm-action';
import { ExpenseSheet } from './expense-sheet';
import type { ExpenseInitial, ExpenseListItem, QuickData } from './types';

export function ExpenseList({ items, data }: { items: ExpenseListItem[]; data: QuickData }) {
  const [editing, setEditing] = useState<ExpenseInitial | null>(null);

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 font-medium bg-slate-900/20 border border-dashed border-white/10 rounded-2xl p-5 text-center">
        Aún no hay movimientos este mes.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {items.map(({ initial, title, subtitle }) => {
          const isIncome = initial.kind === 'income';
          return (
            <li
              key={initial.id}
              className="flex items-center gap-3 bg-black/20 border border-white/5 rounded-2xl pl-4 pr-2 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{title}</p>
                <p className="text-[11px] font-medium text-slate-500 truncate">
                  {shortDate(initial.date)} · {subtitle}
                </p>
              </div>
              <span className={`text-sm font-black font-mono shrink-0 ${isIncome ? 'text-emerald-400' : 'text-rose-300'}`}>
                {isIncome ? '+' : '−'}
                {formatCLP(initial.amount)}
              </span>
              <button
                type="button"
                title="Editar"
                onClick={() => setEditing(initial)}
                className="min-h-11 min-w-11 flex items-center justify-center text-slate-500 hover:text-indigo-400"
              >
                <Pencil size={15} />
              </button>
              <ConfirmAction
                action={deleteExpense}
                fields={{ id: initial.id }}
                title="¿Borrar este movimiento?"
                message={`${title} por ${formatCLP(initial.amount)}. No se puede deshacer.`}
                triggerTitle="Borrar"
                triggerClassName="min-h-11 min-w-11 flex items-center justify-center text-slate-600 hover:text-rose-400"
              >
                <Trash2 size={15} />
              </ConfirmAction>
            </li>
          );
        })}
      </ul>
      <ExpenseSheet
        key={editing?.id ?? 'none'}
        open={editing !== null}
        onClose={() => setEditing(null)}
        data={data}
        initial={editing ?? undefined}
      />
    </>
  );
}
