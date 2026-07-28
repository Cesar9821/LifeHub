import { Activity, TrendingUp, TrendingDown, Wallet, Sparkles, AlertTriangle, CalendarCheck } from 'lucide-react';
import {
  ensureMonthGenerated,
  getMovements,
  getRecurringItems,
  summarize,
  periodOf,
  normalizePeriod,
  periodLabel,
  isCurrentPeriod,
} from '@/services/movements';
import { getCategoryNamesByKind } from '@/services/categories';
import { getHouseholdMembers } from '@/services/household';
import MovementRow from './movement-row';
import VariableForm from './variable-form';
import MonthSelector from './month-selector';

function clp(n: number) {
  return '$' + Math.round(n).toLocaleString('es-CL');
}

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const period = normalizePeriod(params?.mes);
  const isCurrent = isCurrentPeriod(period);

  // Solo genera pendientes automáticamente para el mes en curso o futuros,
  // para no crear movimientos retroactivos en meses ya pasados.
  if (period >= periodOf()) {
    await ensureMonthGenerated(period);
  }

  const [movements, categories, recurringItems, members] = await Promise.all([
    getMovements(period),
    getCategoryNamesByKind(),
    getRecurringItems(),
    getHouseholdMembers(),
  ]);

  const summary = summarize(movements);
  const variableMap = new Map(recurringItems.map((r) => [r.id, r.is_variable]));
  // Solo el primer nombre de cada miembro, por user_id.
  const firstNameById = new Map(members.map((m) => [m.user_id, m.full_name.trim().split(/\s+/)[0]]));

  const monthLabel = periodLabel(period);

  const pending = movements.filter((m) => m.status === 'pending');
  const confirmed = movements.filter((m) => m.status === 'confirmed');

  const pendingIncome = pending.filter((m) => m.kind === 'income');
  const pendingExpense = pending.filter((m) => m.kind === 'expense');
  const confirmedIncome = confirmed.filter((m) => m.kind === 'income');
  const confirmedExpense = confirmed.filter((m) => m.kind === 'expense');

  const renderRow = (m: (typeof movements)[number]) => (
    <MovementRow
      key={m.id}
      id={m.id}
      description={m.description}
      kind={m.kind}
      category={m.category}
      estimatedAmount={m.estimated_amount}
      actualAmount={m.actual_amount}
      effectiveAmount={m.effective_amount}
      status={m.status}
      dueDate={m.due_date}
      dateState={m.date_state}
      isVariable={m.recurring_id ? variableMap.get(m.recurring_id) || false : false}
      registeredBy={m.created_by ? firstNameById.get(m.created_by) ?? null : null}
    />
  );

  return (
    <div className="space-y-8 md:space-y-10 pb-20">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-md w-fit">
            <Activity size={14} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              {isCurrent ? 'Mes en curso' : 'Mes archivado'}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter italic leading-none">
            Movimientos<span className="text-indigo-500">.</span>
          </h1>
        </div>

        <MonthSelector period={period} />
      </div>

      {/* RESUMEN: saldo real + proyección */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo líquido real */}
        <div className="col-span-2 bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 p-6 rounded-[2rem] backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className="text-indigo-400" />
            <p className="text-[9px] font-black text-indigo-400/80 uppercase tracking-[0.2em]">
              Te queda (confirmado)
            </p>
          </div>
          <p className={`text-3xl sm:text-4xl font-black font-mono leading-none break-all ${summary.balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {clp(summary.balance)}
          </p>
          <div className="flex items-center gap-4 mt-4">
            <span className="text-xs font-bold text-emerald-400 font-mono">
              +{clp(summary.incomeConfirmed)} <span className="text-[8px] text-emerald-400/50 uppercase tracking-widest">ingresado</span>
            </span>
            <span className="text-xs font-bold text-rose-400 font-mono">
              −{clp(summary.expenseConfirmed)} <span className="text-[8px] text-rose-400/50 uppercase tracking-widest">gastado</span>
            </span>
          </div>
        </div>

        {/* Proyección fin de mes */}
        <div className="col-span-2 bg-slate-900/40 border border-white/5 p-6 rounded-[2rem] backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-amber-400" />
            <p className="text-[9px] font-black text-amber-400/80 uppercase tracking-[0.2em]">
              Proyección fin de mes
            </p>
          </div>
          <p className={`text-3xl sm:text-4xl font-black font-mono leading-none break-all ${summary.projectedBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {clp(summary.projectedBalance)}
          </p>
          <p className="text-[11px] font-bold text-slate-500 mt-4">
            Si confirmas los {summary.pendingCount} pendientes
            {summary.overdueCount > 0 && (
              <span className="text-rose-400"> · {summary.overdueCount} vencidos</span>
            )}
          </p>
        </div>
      </div>

      {/* FORMULARIO VARIABLE */}
      <VariableForm categories={categories} />

      {/* PENDIENTES: separados en gastos e ingresos */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-amber-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
            Pendientes del mes
          </h2>
          <span className="text-xs font-bold text-slate-600">({pending.length})</span>
        </div>

        {pending.length === 0 ? (
          <div className="bg-slate-900/20 border border-dashed border-white/10 rounded-[2rem] p-10 text-center">
            <p className="text-slate-500 font-bold">
              No hay pendientes. ¡Todo al día este mes!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Column
              title="Gastos por pagar"
              icon={<TrendingDown size={15} className="text-rose-400" />}
              count={pendingExpense.length}
              empty="Sin gastos pendientes."
            >
              {pendingExpense.map(renderRow)}
            </Column>
            <Column
              title="Ingresos por recibir"
              icon={<TrendingUp size={15} className="text-emerald-400" />}
              count={pendingIncome.length}
              empty="Sin ingresos pendientes."
            >
              {pendingIncome.map(renderRow)}
            </Column>
          </div>
        )}
      </div>

      {/* CONFIRMADOS: separados en gastos e ingresos */}
      {confirmed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck size={16} className="text-emerald-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
              Confirmados
            </h2>
            <span className="text-xs font-bold text-slate-600">({confirmed.length})</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Column
              title="Gastos pagados"
              icon={<TrendingDown size={15} className="text-rose-400" />}
              count={confirmedExpense.length}
              empty="Sin gastos confirmados."
            >
              {confirmedExpense.map(renderRow)}
            </Column>
            <Column
              title="Ingresos recibidos"
              icon={<TrendingUp size={15} className="text-emerald-400" />}
              count={confirmedIncome.length}
              empty="Sin ingresos confirmados."
            >
              {confirmedIncome.map(renderRow)}
            </Column>
          </div>
        </div>
      )}
    </div>
  );
}

function Column({
  title,
  icon,
  count,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 px-1">
        {icon}
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
          {title}
        </span>
        <span className="text-[10px] font-bold text-slate-600">({count})</span>
      </div>
      {count === 0 ? (
        <p className="text-xs text-slate-600 font-medium px-1 py-3">{empty}</p>
      ) : (
        children
      )}
    </div>
  );
}
