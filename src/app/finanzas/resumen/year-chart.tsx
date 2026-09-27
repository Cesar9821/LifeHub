'use client';

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCLP } from '@/lib/format';

export interface YearChartRow {
  label: string;
  ingresos: number;
  presupuesto: number;
  gastado: number;
  acumulado: number;
}

export default function YearChart({ rows }: { rows: YearChartRow[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            contentStyle={{ background: '#0F1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: '#fff', fontWeight: 800 }}
            formatter={(value, name) => [formatCLP(Number(value)), String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          <Bar dataKey="ingresos" name="Ingresos" fill="#34d399" radius={[4, 4, 0, 0]} />
          <Bar dataKey="presupuesto" name="Gastos presupuestados" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="gastado" name="Gastado real" fill="#fb7185" radius={[4, 4, 0, 0]} />
          <Line type="monotone" dataKey="acumulado" name="Ahorro acumulado" stroke="#fbbf24" strokeWidth={2.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
