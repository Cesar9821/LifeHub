import { STATUS_LABEL, type BudgetStatus } from '@/lib/plan/budget';

const CHIP: Record<BudgetStatus, string> = {
  ok: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  cerca: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  pasado: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  sin_presupuesto: 'bg-violet-500/10 text-violet-300 border-violet-500/25',
  sin_movimiento: 'bg-white/5 text-slate-500 border-white/10',
};

const BAR: Record<BudgetStatus, string> = {
  ok: 'bg-emerald-500',
  cerca: 'bg-amber-500',
  pasado: 'bg-rose-500',
  sin_presupuesto: 'bg-violet-500',
  sin_movimiento: 'bg-slate-700',
};

export function StatusChip({ status }: { status: BudgetStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${CHIP[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Barra de % usado (se corta visualmente en 100%). */
export function UsageBar({ used, status }: { used: number; status: BudgetStatus }) {
  return (
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${BAR[status]}`} style={{ width: `${Math.min(100, Math.max(0, used * 100))}%` }} />
    </div>
  );
}
