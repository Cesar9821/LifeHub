'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { formatCLP } from '@/lib/format';
import type { BudgetStatus } from '@/lib/plan/budget';
import { ExpenseSheet } from './expense-sheet';
import { UsageBar } from './status-chip';
import type { ExpensePreset, QuickData } from './types';

export interface PotRow {
  conceptId: string;
  name: string;
  budget: number;
  spent: number;
  used: number;
  status: BudgetStatus;
}

/** Gastos variables del mes (bolsas): cuánto va y cuánto queda. Tocar = registrar gasto. */
export function BudgetPots({ rows, data, today }: { rows: PotRow[]; data: QuickData; today: string }) {
  const [preset, setPreset] = useState<ExpensePreset | null>(null);
  if (rows.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-[11px] font-black text-white uppercase tracking-[0.15em] px-1">Gastos variables</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {rows.map((r) => {
          const left = r.budget - r.spent;
          return (
            <li key={r.conceptId}>
              <button
                type="button"
                onClick={() => setPreset({ kind: 'expense', concept_id: r.conceptId, date: today })}
                className="w-full text-left bg-black/20 border border-white/5 rounded-2xl p-3.5 space-y-2 hover:border-white/15 active:scale-[0.99] transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-white truncate">{r.name}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-wider shrink-0">
                    <Plus size={12} /> Gasto
                  </span>
                </div>
                <UsageBar used={r.used} status={r.status} />
                <p className="text-[11px] font-medium text-slate-500">
                  {formatCLP(r.spent)} de {formatCLP(r.budget)}
                  {r.budget > 0 && (
                    <span className={left < 0 ? 'text-rose-400 font-bold' : ''}>
                      {' · '}
                      {left < 0 ? `pasado ${formatCLP(-left)}` : `quedan ${formatCLP(left)}`}
                    </span>
                  )}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
      <ExpenseSheet
        key={preset?.concept_id ?? 'none'}
        open={preset !== null}
        onClose={() => setPreset(null)}
        data={data}
        preset={preset ?? undefined}
      />
    </section>
  );
}
