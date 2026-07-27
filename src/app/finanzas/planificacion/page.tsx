import { Repeat, Trash2, TrendingUp, TrendingDown, Power } from 'lucide-react';
import { getRecurringItems } from '@/services/movements';
import { getCategoryNamesByKind } from '@/services/categories';
import { deleteRecurring, toggleRecurring } from './actions';
import RecurringForm from './recurring-form';

function clp(n: number) {
  return '$' + Math.round(n).toLocaleString('es-CL');
}

export default async function PlanificacionPage() {
  const [items, cats] = await Promise.all([
    getRecurringItems(),
    getCategoryNamesByKind(),
  ]);

  const incomes = items.filter((i) => i.kind === 'income');
  const expenses = items.filter((i) => i.kind === 'expense');

  const totalIncome = incomes.filter((i) => i.is_active).reduce((a, i) => a + i.amount, 0);
  const totalExpense = expenses.filter((i) => i.is_active).reduce((a, i) => a + i.amount, 0);
  const freeMonthly = totalIncome - totalExpense;

  return (
    <div className="space-y-8 md:space-y-12 pb-20">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-md w-fit">
            <Repeat size={14} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Configuración recurrente
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter italic leading-none">
            Planificación<span className="text-indigo-500">.</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] max-w-md">
            Define tus ingresos y gastos fijos. Se generan cada mes solos.
          </p>
        </div>

        {/* Resumen mensual planificado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryCard label="Ingresos fijos" value={totalIncome} color="emerald" />
          <SummaryCard label="Gastos fijos" value={totalExpense} color="rose" />
          <SummaryCard label="Libre estimado" value={freeMonthly} color="indigo" signed />
        </div>
      </div>

      {/* FORMULARIO */}
      <RecurringForm categories={cats} />

      {/* LISTADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecurringList
          title="Ingresos fijos"
          icon={<TrendingUp size={18} className="text-emerald-400" />}
          items={incomes}
          emptyMsg="Aún no defines ingresos fijos (ej: sueldo)."
        />
        <RecurringList
          title="Gastos fijos"
          icon={<TrendingDown size={18} className="text-rose-400" />}
          items={expenses}
          emptyMsg="Aún no defines gastos fijos (ej: arriendo)."
        />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  signed,
}: {
  label: string;
  value: number;
  color: 'emerald' | 'rose' | 'indigo';
  signed?: boolean;
}) {
  const colorMap = {
    emerald: 'text-emerald-400',
    rose: 'text-rose-400',
    indigo: value >= 0 ? 'text-indigo-400' : 'text-rose-400',
  };
  return (
    <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl backdrop-blur-xl">
      <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className={`text-lg font-black font-mono leading-none ${colorMap[color]}`}>
        {signed && value >= 0 ? '+' : ''}
        {clp(value)}
      </p>
    </div>
  );
}

function RecurringList({
  title,
  icon,
  items,
  emptyMsg,
}: {
  title: string;
  icon: React.ReactNode;
  items: {
    id: string;
    description: string;
    amount: number;
    due_day: number;
    is_variable: boolean;
    is_active: boolean;
    category: string;
  }[];
  emptyMsg: string;
}) {
  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-6">
        {icon}
        <h2 className="text-lg font-black text-white uppercase tracking-wider">{title}</h2>
        <span className="text-xs font-bold text-slate-600">({items.length})</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-600 font-medium">{emptyMsg}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between bg-black/20 border border-white/5 rounded-xl px-4 py-3 group ${
                !item.is_active ? 'opacity-40' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-slate-400">{item.due_day}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate">{item.description}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {item.category}
                    {item.is_variable && ' · variable'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-black font-mono text-slate-300">{clp(item.amount)}</span>
                <form action={toggleRecurring}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="is_active" value={String(item.is_active)} />
                  <button
                    type="submit"
                    title={item.is_active ? 'Pausar' : 'Activar'}
                    className={`transition-colors ${
                      item.is_active ? 'text-emerald-500 hover:text-emerald-400' : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    <Power size={15} />
                  </button>
                </form>
                <form action={deleteRecurring}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    title="Eliminar"
                    className="text-slate-600 hover:text-rose-400 transition-colors opacity-60 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
