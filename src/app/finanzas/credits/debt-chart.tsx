'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCLP } from '@/lib/format';

export const ITEM_COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f472b6', '#38bdf8', '#a78bfa', '#fb7185', '#2dd4bf'];

/** Barras apiladas del plan CMR: pago de cada ítem por mes (cuota + adelanto). */
export default function DebtChart({
  rows,
  items,
}: {
  rows: Record<string, number | string>[];
  items: { id: string; name: string }[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            contentStyle={{ background: '#0F1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: '#fff', fontWeight: 800 }}
            formatter={(value, name) => [formatCLP(Number(value)), String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          {items.map((it, i) => (
            <Bar key={it.id} dataKey={it.id} name={it.name} stackId="cmr" fill={ITEM_COLORS[i % ITEM_COLORS.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
