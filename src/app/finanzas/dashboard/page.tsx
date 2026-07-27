import Link from 'next/link';
import {
  Wallet,
  Sparkles,
  PiggyBank,
  CreditCard,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Target,
  Landmark,
  ShieldCheck,
} from 'lucide-react';
import { getDashboardData } from '@/services/dashboard-v2';
import { normalizePeriod, periodLabel, isCurrentPeriod } from '@/services/movements';
import MonthSelector from '../movimientos/month-selector';

const CLP = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const period = normalizePeriod(params?.mes);
  const d = await getDashboardData(period);
  const isCurrent = isCurrentPeriod(period);

  const maxTrend = Math.max(...d.trend.map((t) => Math.abs(t.balance)), 1);

  // Fondo de emergencia: cuántos meses de gastos cubren tus ahorros (ideal 6).
  const monthsCovered = d.plannedExpense > 0 ? d.totalSavings / d.plannedExpense : 0;
  const fundPct = Math.min(100, Math.round((monthsCovered / 6) * 100));
  const fundText = monthsCovered >= 6 ? 'text-emerald-400' : monthsCovered >= 3 ? 'text-amber-400' : 'text-rose-400';
  const fundBar = monthsCovered >= 6 ? 'bg-emerald-500' : monthsCovered >= 3 ? 'bg-amber-500' : 'bg-rose-500';

  // Progreso presupuestado vs real
  const expenseProgress =
    d.plannedExpense > 0
      ? Math.min((d.month.expenseConfirmed / d.plannedExpense) * 100, 100)
      : 0;
  const incomeProgress =
    d.plannedIncome > 0
      ? Math.min((d.month.incomeConfirmed / d.plannedIncome) * 100, 100)
      : 0;

  return (
    <div className="space-y-8 md:space-y-10 pb-20">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-md w-fit">
            <Activity size={14} className="text-emerald-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              {isCurrent ? 'Mes en curso' : periodLabel(period)}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter italic leading-none">
            Dashboard<span className="text-indigo-500">.</span>
          </h1>
        </div>
        <MonthSelector period={period} basePath="/finanzas/dashboard" />
      </div>

      {/* SALDO + PROYECCIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 p-6 md:p-8 rounded-[2rem] backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={16} className="text-indigo-400" />
            <p className="text-[9px] font-black text-indigo-400/80 uppercase tracking-[0.2em]">
              Saldo líquido confirmado
            </p>
          </div>
          <p
            className={`text-3xl sm:text-4xl md:text-5xl font-black font-mono leading-none break-all ${
              d.month.balance >= 0 ? 'text-white' : 'text-rose-400'
            }`}
          >
            {CLP(d.month.balance)}
          </p>
          <div className="flex items-center gap-5 mt-5">
            <span className="text-xs font-bold text-emerald-400 font-mono">
              +{CLP(d.month.incomeConfirmed)}
            </span>
            <span className="text-xs font-bold text-rose-400 font-mono">
              −{CLP(d.month.expenseConfirmed)}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 p-6 md:p-8 rounded-[2rem] backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-amber-400" />
            <p className="text-[9px] font-black text-amber-400/80 uppercase tracking-[0.2em]">
              Proyección fin de mes
            </p>
          </div>
          <p
            className={`text-3xl sm:text-4xl md:text-5xl font-black font-mono leading-none break-all ${
              d.month.projectedBalance >= 0 ? 'text-white' : 'text-rose-400'
            }`}
          >
            {CLP(d.month.projectedBalance)}
          </p>
          <div className="flex items-center gap-3 mt-5">
            <span className="text-xs font-bold text-slate-500">
              {d.month.pendingCount} pendientes
            </span>
            {d.month.overdueCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400">
                <AlertTriangle size={12} />
                {d.month.overdueCount} vencidos
              </span>
            )}
          </div>
        </div>
      </div>

      {/* PRESUPUESTADO VS REAL */}
      <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-6">
          <Target size={16} className="text-indigo-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
            Presupuestado vs real
          </h2>
        </div>

        <div className="space-y-6">
          <ProgressRow
            label="Ingresos"
            real={d.month.incomeConfirmed}
            planned={d.plannedIncome}
            percent={incomeProgress}
            color="emerald"
          />
          <ProgressRow
            label="Gastos"
            real={d.month.expenseConfirmed}
            planned={d.plannedExpense}
            percent={expenseProgress}
            color="rose"
          />
        </div>

        <Link
          href="/finanzas/planificacion"
          className="inline-flex items-center gap-1.5 mt-6 text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-wider transition-colors"
        >
          Ajustar planificación <ArrowRight size={12} />
        </Link>
      </div>

      {/* PATRIMONIO NETO */}
      <div className="bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 p-6 md:p-8 rounded-[2rem] backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-3">
          <Landmark size={16} className="text-teal-400" />
          <p className="text-[9px] font-black text-teal-400/80 uppercase tracking-[0.2em]">
            Patrimonio neto (ahorros − deuda)
          </p>
        </div>
        <p
          className={`text-3xl sm:text-4xl md:text-5xl font-black font-mono leading-none break-all ${
            d.totalSavings - d.totalDebt >= 0 ? 'text-white' : 'text-rose-400'
          }`}
        >
          {CLP(d.totalSavings - d.totalDebt)}
        </p>
        <div className="flex items-center gap-5 mt-5">
          <span className="text-xs font-bold text-teal-400 font-mono">+{CLP(d.totalSavings)} ahorros</span>
          <span className="text-xs font-bold text-rose-400 font-mono">−{CLP(d.totalDebt)} deuda</span>
        </div>
      </div>

      {/* PATRIMONIO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<PiggyBank size={18} className="text-teal-400" />}
          label="Ahorros"
          value={CLP(d.totalSavings)}
          href="/finanzas/savings"
        />
        <StatCard
          icon={<CreditCard size={18} className="text-rose-400" />}
          label="Deuda total"
          value={CLP(d.totalDebt)}
          href="/finanzas/credits"
        />
        <StatCard
          icon={<Activity size={18} className="text-indigo-400" />}
          label="Salud financiera"
          value={`${d.healthScore}%`}
        />
      </div>

      {/* FONDO DE EMERGENCIA */}
      {d.plannedExpense > 0 && (
        <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Fondo de emergencia</h2>
            </div>
            <span className={`text-xs font-black font-mono ${fundText}`}>
              {monthsCovered.toFixed(1)} meses
            </span>
          </div>
          <div className="h-2.5 bg-black/40 rounded-full overflow-hidden">
            <div className={`h-full ${fundBar} rounded-full transition-all`} style={{ width: `${fundPct}%` }} />
          </div>
          <p className="text-[11px] font-medium text-slate-500 mt-2">
            Tus ahorros cubren {monthsCovered.toFixed(1)} de 6 meses de gastos. La meta sana: 3 a 6 meses.
          </p>
        </div>
      )}

      {/* GASTO POR CATEGORÍA */}
      {d.byCategory.length > 0 && (
        <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-6">
            <TrendingDown size={16} className="text-rose-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Gasto por categoría</h2>
          </div>
          <div className="space-y-4">
            {d.byCategory.map((c) => {
              const max = d.byCategory[0].total || 1;
              const pct = Math.round((c.total / max) * 100);
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{c.category}</span>
                    <span className="text-xs font-mono font-bold text-rose-400">{CLP(c.total)}</span>
                  </div>
                  <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500/70 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TENDENCIA 6 MESES */}
      <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-8">
          <TrendingUp size={16} className="text-emerald-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
            Saldo últimos 6 meses
          </h2>
        </div>

        <div className="flex items-end justify-between gap-1.5 sm:gap-3 h-32 sm:h-40">
          {d.trend.map((t, i) => {
            const heightPct = (Math.abs(t.balance) / maxTrend) * 100;
            const positive = t.balance >= 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span
                  className={`text-[7px] sm:text-[9px] font-black font-mono truncate max-w-full ${
                    positive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {t.balance !== 0 ? CLP(t.balance) : ''}
                </span>
                <div
                  className={`w-full rounded-t-lg transition-all ${
                    positive ? 'bg-emerald-500/60' : 'bg-rose-500/60'
                  }`}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                />
                <span className="text-[9px] font-black text-slate-500 uppercase">
                  {t.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ACCESO RÁPIDO */}
      <Link
        href={`/finanzas/movimientos?mes=${period.slice(0, 7)}`}
        className="flex items-center justify-between bg-white text-black px-8 py-5 rounded-[1.75rem] font-black hover:bg-slate-200 transition-all active:scale-[0.98]"
      >
        <span className="uppercase tracking-wider text-sm">Ir a movimientos</span>
        <ArrowRight size={20} />
      </Link>
    </div>
  );
}

function ProgressRow({
  label,
  real,
  planned,
  percent,
  color,
}: {
  label: string;
  real: number;
  planned: number;
  percent: number;
  color: 'emerald' | 'rose';
}) {
  const barColor = color === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500';
  const textColor = color === 'emerald' ? 'text-emerald-400' : 'text-rose-400';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-xs font-bold font-mono text-slate-400">
          <span className={textColor}>{CLP(real)}</span>
          <span className="text-slate-600"> / {CLP(planned)}</span>
        </span>
      </div>
      <div className="h-2.5 bg-black/40 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[1.75rem] backdrop-blur-xl h-full hover:border-white/10 transition-all">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
          {label}
        </p>
      </div>
      <p className="text-2xl font-black font-mono text-white leading-none">{value}</p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
