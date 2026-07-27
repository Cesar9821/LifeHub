import { PieChart, Trash2, AlertTriangle } from 'lucide-react';
import { getBudgets, summarizeBudgets } from '@/services/budgets';
import { getExpenseCategoryNames } from '@/services/categories';
import { formatCLP } from '@/lib/format';
import BudgetForm from './budget-form';
import { deleteBudget } from './actions';

export const dynamic = 'force-dynamic';

function barColor(percent: number): string {
  if (percent > 100) return 'bg-rose-500';
  if (percent >= 80) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function textColor(percent: number): string {
  if (percent > 100) return 'text-rose-400';
  if (percent >= 80) return 'text-amber-400';
  return 'text-emerald-400';
}

export default async function PresupuestosPage() {
  const [budgets, categories] = await Promise.all([getBudgets(), getExpenseCategoryNames()]);
  const summary = summarizeBudgets(budgets);

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-10 pb-20">
      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 w-fit">
          <PieChart size={12} className="text-emerald-400" />
          <span className="text-[9px] md:text-[10px] font-bold text-emerald-400/80 uppercase tracking-[0.2em]">
            Límites del mes
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic">
          Presupuestos<span className="text-emerald-500">.</span>
        </h1>
      </div>

      {/* RESUMEN */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StatTile label="Presupuestado" value={formatCLP(summary.totalBudget)} accent="text-white" />
        <StatTile label="Gastado" value={formatCLP(summary.totalSpent)} accent="text-emerald-400" />
        <StatTile
          label="Excedidos"
          value={String(summary.overCount)}
          accent={summary.overCount > 0 ? 'text-rose-400' : 'text-slate-500'}
        />
      </div>

      <BudgetForm categories={categories} />

      {/* LISTA */}
      {budgets.length === 0 ? (
        <div className="border-2 border-dashed border-slate-800/50 rounded-[2.5rem] p-12 md:p-16 flex flex-col items-center justify-center text-center gap-4">
          <PieChart size={40} className="text-slate-800" />
          <p className="text-slate-600 font-black uppercase text-xs tracking-widest">
            Fija un límite mensual por categoría para tomar el control.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => (
            <div key={b.category} className="bg-slate-900/40 border border-white/5 rounded-[1.75rem] p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-sm font-black text-white uppercase tracking-wide truncate">{b.category}</h3>
                  {b.spent > b.amount && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-rose-400 uppercase tracking-widest">
                      <AlertTriangle size={11} /> Excedido
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-slate-400">
                    {formatCLP(b.spent)} <span className="text-slate-600">/ {formatCLP(b.amount)}</span>
                  </span>
                  <form action={deleteBudget}>
                    <input type="hidden" name="category" value={b.category} />
                    <button
                      type="submit"
                      title="Eliminar"
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
              </div>
              <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor(b.percent)}`}
                  style={{ width: `${Math.min(100, b.percent)}%` }}
                />
              </div>
              <p className={`text-[10px] font-black font-mono mt-1.5 ${textColor(b.percent)}`}>
                {b.percent}% usado
                {b.amount > b.spent && ` · quedan ${formatCLP(b.amount - b.spent)}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-[#0A0C10] border border-white/10 p-4 md:p-5 rounded-[1.5rem] text-center">
      <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{label}</p>
      <p className={`text-lg md:text-2xl font-black font-mono tracking-tighter ${accent}`}>{value}</p>
    </div>
  );
}
