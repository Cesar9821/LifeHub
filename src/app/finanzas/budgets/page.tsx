import { PieChart, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getBudgetProgress } from '@/services/budgets';
import { getExpenseCategoryNames } from '@/services/categories';
import { setBudget, deleteBudget } from './actions';

function clp(n: number) {
  return '$' + Math.round(n).toLocaleString('es-CL');
}

export default async function BudgetsPage() {
  const [progress, expenseCategories] = await Promise.all([
    getBudgetProgress(),
    getExpenseCategoryNames(),
  ]);

  // Categorías que aún no tienen presupuesto (para el select del formulario)
  const withBudget = new Set(progress.map((p) => p.category));
  const available = expenseCategories.filter((c) => !withBudget.has(c));

  const totalLimit = progress.reduce((a, p) => a + p.limit, 0);
  const totalSpent = progress.reduce((a, p) => a + p.spent, 0);

  const inputStyles =
    'bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all backdrop-blur-md w-full';

  return (
    <div className="space-y-8 md:space-y-12 pb-20">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-md w-fit">
            <PieChart size={14} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Control mensual
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic leading-none">
            Presupuestos<span className="text-indigo-500">.</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] max-w-md">
            Define un límite por categoría y controla tus gastos del mes
          </p>
        </div>

        {progress.length > 0 && (
          <div className="bg-indigo-500/5 border border-indigo-500/10 p-5 md:px-8 rounded-[2rem] backdrop-blur-xl">
            <p className="text-[9px] font-black text-indigo-500/60 uppercase tracking-[0.2em] mb-1">
              Gastado / Presupuestado
            </p>
            <p className="text-2xl font-black text-white font-mono leading-none">
              {clp(totalSpent)}{' '}
              <span className="text-slate-600 text-lg">/ {clp(totalLimit)}</span>
            </p>
          </div>
        )}
      </div>

      {/* FORMULARIO: nuevo presupuesto */}
      {available.length > 0 ? (
        <form
          action={setBudget}
          className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
              Categoría
            </label>
            <select name="category" required className={`${inputStyles} appearance-none pr-8`}>
              {available.map((c) => (
                <option key={c} value={c} className="bg-[#0A0C10]">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
              Límite mensual (CLP)
            </label>
            <input
              name="amount"
              type="number"
              min="1"
              required
              placeholder="Ej: 150000"
              className={inputStyles}
            />
          </div>
          <button
            type="submit"
            className="bg-white text-black px-6 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95"
          >
            <Plus size={16} /> Definir
          </button>
        </form>
      ) : expenseCategories.length === 0 ? (
        <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-8 backdrop-blur-xl text-center">
          <p className="text-slate-400 font-medium">
            Primero crea categorías de gasto para poder asignarles un presupuesto.
          </p>
          <a
            href="/finanzas/categories"
            className="inline-block mt-4 text-indigo-400 hover:text-indigo-300 font-bold text-sm"
          >
            Ir a Categorías →
          </a>
        </div>
      ) : (
        <p className="text-sm text-slate-600 font-medium">
          Ya definiste un presupuesto para todas tus categorías de gasto.
        </p>
      )}

      {/* LISTA DE PRESUPUESTOS CON PROGRESO */}
      {progress.length === 0 ? (
        <div className="bg-slate-900/20 border border-dashed border-white/10 rounded-[2rem] p-12 text-center">
          <PieChart size={32} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">
            Aún no tienes presupuestos. Define el primero arriba.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {progress.map((p) => {
            const barColor =
              p.status === 'over'
                ? 'bg-rose-500'
                : p.status === 'warning'
                ? 'bg-amber-500'
                : 'bg-emerald-500';
            const accentText =
              p.status === 'over'
                ? 'text-rose-400'
                : p.status === 'warning'
                ? 'text-amber-400'
                : 'text-emerald-400';
            const width = Math.min(p.percent, 100);

            return (
              <div
                key={p.category}
                className="bg-slate-900/40 border border-white/5 rounded-[1.75rem] p-6 backdrop-blur-xl group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {p.status === 'over' ? (
                      <AlertTriangle size={18} className="text-rose-400" />
                    ) : p.status === 'warning' ? (
                      <AlertTriangle size={18} className="text-amber-400" />
                    ) : (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    )}
                    <span className="font-black text-white text-lg">{p.category}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-black font-mono ${accentText}`}>
                      {Math.round(p.percent)}%
                    </span>
                    <form action={deleteBudget}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        title="Eliminar presupuesto"
                        className="text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={15} />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="h-3 bg-black/40 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${width}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 font-mono">
                    {clp(p.spent)} de {clp(p.limit)}
                  </span>
                  <span
                    className={
                      p.remaining < 0 ? 'text-rose-400 font-mono' : 'text-slate-500 font-mono'
                    }
                  >
                    {p.remaining < 0
                      ? `Excedido por ${clp(Math.abs(p.remaining))}`
                      : `Quedan ${clp(p.remaining)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
