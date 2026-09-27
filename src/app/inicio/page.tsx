import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, PiggyBank, TrendingDown, Wallet, Zap } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { formatCLP } from '@/lib/format';
import { budgetStatus, STATUS_LABEL } from '@/lib/plan/budget';
import { defaultMonth, expenseListItems, loadPlanPage, monthView, savedBefore } from '@/services/plan';
import MonthSelector from '@/app/finanzas/movimientos/month-selector';
import { QuickExpenseFab } from '@/components/finanzas/expense-sheet';
import { ExpenseList } from '@/components/finanzas/expense-list';
import { RealtimeRefresh } from '@/components/finanzas/realtime-refresh';
import { SchemaMissingCard, SeedPlanCard } from '@/components/finanzas/seed-plan-card';
import { UsageBar } from '@/components/finanzas/status-chip';

export const dynamic = 'force-dynamic';

// Ícono y nombre propios para diferenciar esta pantalla al agregarla a la
// pantalla de inicio del iPhone (usa el apple-touch-icon de esta ruta).
export const metadata: Metadata = {
  title: 'Finanzas',
  appleWebApp: {
    capable: true,
    title: 'Finanzas',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icon-inicio-192.png',
    apple: '/apple-icon-inicio.png',
  },
};

export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const { plan, householdId, registrantById, myName, quick } = await loadPlanPage();
  const firstName = myName.trim().split(/\s+/)[0] || 'Hola';

  const month = defaultMonth(plan, params?.mes);
  const v = monthView(plan, month);
  const saved = savedBefore(plan, month);
  const totalStatus = budgetStatus(v.expenseBudget, v.spent);
  const cmrRow = plan.cmr.months.find((m) => m.month === month);
  const advances = plan.debtItems
    .filter((d) => (cmrRow?.items[d.id]?.advance ?? 0) >= 1)
    .map((d) => `${formatCLP(cmrRow!.items[d.id].advance)} a ${d.name}`);

  const recent = expenseListItems(plan, v.movements.slice(0, 10), registrantById);

  return (
    <div className="min-h-screen bg-[#050608] px-4 sm:px-5 pt-8 pb-32">
      <div className="max-w-lg mx-auto space-y-5">
        {/* SALUDO */}
        <header className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-indigo-400/80 uppercase tracking-[0.25em]">LifeHub · Finanzas</p>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {firstName === 'Hola' ? 'Hola' : `Hola, ${firstName}`}
              <span className="text-indigo-500">.</span>
            </h1>
          </div>
          <Link
            href="/hub"
            className="min-h-11 inline-flex items-center gap-1.5 px-3 rounded-xl border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-wider hover:text-white"
          >
            App <ArrowRight size={13} />
          </Link>
        </header>

        {!plan.schemaReady ? (
          <SchemaMissingCard />
        ) : !plan.seeded ? (
          <SeedPlanCard />
        ) : (
          <>
            <MonthSelector period={month} basePath="/inicio" />

            {/* DISPONIBLE */}
            <section className="bg-gradient-to-br from-indigo-500/15 to-transparent border border-indigo-500/25 rounded-[2rem] p-6">
              <p className="flex items-center gap-2 text-[10px] font-black text-indigo-300/90 uppercase tracking-[0.2em]">
                <Wallet size={14} /> Disponible este mes
              </p>
              <p className={`mt-2 text-4xl font-black font-mono leading-none break-all ${v.available >= 0 ? 'text-white' : 'text-rose-400'}`}>
                {formatCLP(v.available)}
              </p>
              <p className="mt-3 text-xs font-bold text-slate-400">
                Ingresos {formatCLP(v.income)} · gastado {formatCLP(v.spent)}
              </p>
            </section>

            <div className="grid grid-cols-2 gap-3">
              {/* GASTADO VS PRESUPUESTO */}
              <section className="bg-slate-900/40 border border-white/5 rounded-[1.5rem] p-4 space-y-2.5">
                <p className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                  <TrendingDown size={13} className="text-rose-400" /> Gastado
                </p>
                <p className="text-lg font-black font-mono text-white leading-none">{formatCLP(v.spent)}</p>
                <UsageBar used={v.expenseBudget > 0 ? v.spent / v.expenseBudget : 0} status={totalStatus} />
                <p className="text-[11px] font-bold text-slate-500">
                  de {formatCLP(v.expenseBudget)}
                  {v.expenseBudget > 0 && ` · ${Math.round((v.spent / v.expenseBudget) * 100)}%`}
                </p>
              </section>

              {/* AHORRO ACUMULADO */}
              <section className="bg-slate-900/40 border border-white/5 rounded-[1.5rem] p-4 space-y-2.5">
                <p className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                  <PiggyBank size={13} className="text-emerald-400" /> Ahorro acumulado
                </p>
                <p className={`text-lg font-black font-mono leading-none ${saved >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                  {formatCLP(saved)}
                </p>
                <p className="text-[11px] font-bold text-slate-500">Meses ya cerrados del plan</p>
              </section>
            </div>

            {/* ALERTAS */}
            {v.alerts.length > 0 && (
              <section className="bg-amber-500/5 border border-amber-500/20 rounded-[1.5rem] p-4 space-y-2">
                <p className="flex items-center gap-2 text-[10px] font-black text-amber-300 uppercase tracking-[0.15em]">
                  <AlertTriangle size={14} /> Atención
                </p>
                <ul className="space-y-1.5">
                  {v.alerts.map((a) => (
                    <li key={a.concept.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-200 font-bold truncate">{a.concept.name}</span>
                      <span className={`text-xs font-black shrink-0 ${a.status === 'cerca' ? 'text-amber-300' : 'text-rose-300'}`}>
                        {STATUS_LABEL[a.status]}
                        {a.budget > 0 && ` · ${Math.round(a.used * 100)}%`}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* CMR: QUÉ ADELANTAR */}
            {advances.length > 0 && (
              <Link
                href="/finanzas/credits"
                className="flex items-start gap-3 bg-slate-900/40 border border-white/5 rounded-[1.5rem] p-4 hover:border-white/15"
              >
                <Zap size={16} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-300">
                  <span className="font-black text-white">CMR:</span> este mes paga {formatCLP(cmrRow!.total)} y adelanta{' '}
                  {advances.join(' y ')}.
                </p>
              </Link>
            )}

            {/* ÚLTIMOS MOVIMIENTOS */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-black text-white uppercase tracking-[0.15em]">Últimos movimientos</h2>
                <Link
                  href={`/finanzas/presupuestos?mes=${month.slice(0, 7)}`}
                  className="min-h-11 inline-flex items-center text-[10px] font-black text-indigo-400 uppercase tracking-wider"
                >
                  Ver presupuesto
                </Link>
              </div>
              <ExpenseList items={recent} data={quick} />
            </section>
          </>
        )}

        <Link
          href="/hub"
          className="flex items-center justify-center gap-2 w-full min-h-12 rounded-[2rem] border border-white/10 bg-white/5 text-slate-300 font-black text-sm uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all active:scale-95"
        >
          Entrar a la aplicación <ArrowRight size={16} />
        </Link>
      </div>

      {plan.seeded && <QuickExpenseFab data={quick} />}
      <RealtimeRefresh householdId={householdId} />
    </div>
  );
}
