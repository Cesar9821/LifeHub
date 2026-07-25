'use client'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { ProjectionPoint } from '@/lib/finance-logic';

export function ProjectionChart({ data }: { data: ProjectionPoint[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
          />
          <YAxis 
            hide 
            domain={['dataMin - 1000', 'dataMax + 1000']} 
          />
<Tooltip 
  formatter={(value) => {
    // 1. Validamos si el valor existe
    if (value === undefined || value === null) return ["$0.00", "Balance Proyectado"];

    // 2. Convertimos a número de forma segura
    const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);

    // 3. Retornamos el par de strings que pide el Formatter de Recharts
    return [formatCurrency(numericValue), "Balance Proyectado"] as [string, string];
  }}
  contentStyle={{ 
    borderRadius: '12px', 
    border: 'none', 
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
  }}
/>
          <Area 
            type="monotone" 
            dataKey="balance" 
            stroke="#6366f1" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorBalance)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}