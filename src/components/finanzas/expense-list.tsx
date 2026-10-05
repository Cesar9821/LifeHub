'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteExpense } from '@/app/(app)/finanzas/plan/actions';
import { formatCLP, shortDate } from '@/lib/format';
import { ConfirmAction } from './confirm-action';
import { ExpenseSheet } from './expense-sheet';
import type { ExpenseInitial, ExpenseListItem, QuickData } from './types';

export function ExpenseList({ items, data }: { items: ExpenseListItem[]; data: QuickData }) {
  const [editing, setEditing] = useState<ExpenseInitial | null>(null);

  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-3 font-medium bg-surface border border-dashed border-line-strong rounded-2xl p-5 text-center">
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
              className="flex items-center gap-3 bg-black/20 border border-line rounded-2xl pl-4 pr-2 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink truncate">{title}</p>
                <p className="text-xs font-medium text-ink-3 truncate">
                  {shortDate(initial.date)} · {subtitle}
                </p>
              </div>
              <span className={`text-sm font-semibold tabular-nums shrink-0 ${isIncome ? 'text-emerald-400' : 'text-rose-300'}`}>
                {isIncome ? '+' : '−'}
                {formatCLP(initial.amount)}
              </span>
              <button
                type="button"
                title="Editar"
                onClick={() => setEditing(initial)}
                className="min-h-11 min-w-11 flex items-center justify-center text-ink-3 hover:text-indigo-400"
              >
                <Pencil size={15} />
              </button>
              <ConfirmAction
                action={deleteExpense}
                fields={{ id: initial.id }}
                title="¿Borrar este movimiento?"
                message={`${title} por ${formatCLP(initial.amount)}. No se puede deshacer.`}
                triggerTitle="Borrar"
                triggerClassName="min-h-11 min-w-11 flex items-center justify-center text-ink-3 hover:text-rose-400"
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
