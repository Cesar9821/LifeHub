'use client';

import { useState } from 'react';
import { formatCLP } from '@/lib/format';
import { ExpenseList } from './expense-list';
import type { ExpenseListItem, QuickData } from './types';

type KindFilter = 'todos' | 'expense' | 'income';

/** Movimientos del mes con filtros por tipo y por persona. */
export function MovementsBrowser({ items, data }: { items: ExpenseListItem[]; data: QuickData }) {
  const [kind, setKind] = useState<KindFilter>('todos');
  const [person, setPerson] = useState('todos');

  const filtered = items.filter(
    (i) => (kind === 'todos' || i.initial.kind === kind) && (person === 'todos' || i.initial.paid_by === person)
  );
  const spent = filtered.filter((i) => i.initial.kind === 'expense').reduce((a, i) => a + i.initial.amount, 0);
  const income = filtered.filter((i) => i.initial.kind === 'income').reduce((a, i) => a + i.initial.amount, 0);

  const chip = (active: boolean) =>
    `min-h-11 px-4 rounded-xl text-xs font-semibold border whitespace-nowrap transition-all ${
      active ? 'bg-white text-black border-white' : 'bg-black/30 text-ink-2 border-line-strong hover:text-ink'
    }`;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
        {(
          [
            ['todos', 'Todos'],
            ['expense', 'Gastos'],
            ['income', 'Ingresos'],
          ] as const
        ).map(([value, label]) => (
          <button key={value} type="button" onClick={() => setKind(value)} className={chip(kind === value)}>
            {label}
          </button>
        ))}
        <span className="w-px bg-white/10 mx-1 shrink-0" />
        {['todos', ...data.people, 'Ambos'].map((p) => (
          <button key={p} type="button" onClick={() => setPerson(p)} className={chip(person === p)}>
            {p === 'todos' ? 'Todos' : p}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-bold px-1">
        <span className="text-ink-2">{filtered.length} movimientos</span>
        {spent > 0 && <span className="text-rose-300">Gastos {formatCLP(spent)}</span>}
        {income > 0 && <span className="text-emerald-300">Ingresos {formatCLP(income)}</span>}
      </div>

      <ExpenseList items={filtered} data={data} />
    </div>
  );
}
