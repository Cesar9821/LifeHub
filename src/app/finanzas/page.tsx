import Link from 'next/link';
import { AlertTriangle, ArrowRight, PiggyBank, TrendingDown, Wallet } from 'lucide-react';
import { formatCLP } from '@/lib/format';
import { budgetStatus, STATUS_LABEL } from '@/lib/plan/budget';
import {
  accountItems,
  defaultMonth,
  expenseListItems,
  loadPlanPage,
  monthView,
  savedBefore,
} from '@/services/plan';
import MonthSelector from '@/app/finanzas/movimientos/month-selector';
import { AccountsChecklist } from '@/components/finanzas/accounts-checklist';
import { BudgetPots } from '@/components/finanzas/budget-pots';
import { ExpenseList } from '@/components/finanzas/expense-list';
import { SchemaMissingCard, SeedPlanCard } from '@/components/finanzas/seed-plan-card';
import { UsageBar } from '@/components/finanzas/status-chip';

export const dynamic = 'force-dynamic';

/**
 * Mes: la pantalla del día a día. Cuánto queda, qué cuentas faltan por pagar
 * (con Pagar en un toque), cómo van los gastos variables y lo último registrado.
 */
export default async function MesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const { plan, registrantById, myName, quick } = await loadPlanPage();
  const firstName = myName.trim().split(/\s+/)[0];

  if (!plan.schemaReady || !plan.seeded || !plan.checklistReady) {
    return (
      <div className="space-y-6 max-w-lg mx-auto pb-24">
        <h1 className="text-3xl font-black text-white tracking-tight">
          {firstName ? `Hola, ${firstName}` : 'Hola'}
          <span className="text-indigo-500">.</span>
        </h1>
        {!plan.schemaReady ? (
          <SchemaMissingCard />
        ) : !plan.checklistReady ? (
          <SchemaMissingCard file="schema-plan-hogar-v2.sql" />
        ) : (
          <SeedPlanCard />
        )}
      </div>
    );
  }

  const month = defaultMonth(plan, params?.mes);
  const v = monthView(plan, month);
  const saved = savedBefore(plan, month);
  const totalStatus = budgetStatus(v.expenseBudget, v.spent);

  const pots = v.groups
    .flatMap((g) => g.rows)
    .filter((r) => r.concept.pay_mode === 'bolsa' && (r.budget > 0 || r.spent > 0))
    .map((r) => ({
      conceptId: r.concept.id,
      name: r.concept.name,
      budget: r.budget,
      spent: r.spent,
      used: r.used,
      status: r.status,
    }));

  const recent = expenseListItems(plan, v.movements.slice(0, 5), registrantById);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-28">
      <div className="space-y-4">
        <p className="text-sm font-bold text-slate-400">{firstName ? `Hola, ${firstName} 👋` : 'Hola 👋'}</p>
        <MonthSelector period={month} basePath="/finanzas" />
      </div>

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
        <Link
          href={`/finanzas/presupuestos?mes=${month.slice(0, 7)}`}
          className="bg-slate-900/40 border border-white/5 rounded-[1.5rem] p-4 space-y-2.5 hover:border-white/15"
        >
          <p className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
            <TrendingDown size={13} className="text-rose-400" /> Gastado vs plan
          </p>
          <p className="text-lg font-black font-mono text-white leading-none">{formatCLP(v.spent)}</p>
          <UsageBar used={v.expenseBudget > 0 ? v.spent / v.expenseBudget : 0} status={totalStatus} />
          <p className="text-[11px] font-bold text-slate-500">
            de {formatCLP(v.expenseBudget)}
            {v.expenseBudget > 0 && ` · ${Math.round((v.spent / v.expenseBudget) * 100)}%`}
          </p>
        </Link>
        <Link
          href="/finanzas/resumen"
          className="bg-slate-900/40 border border-white/5 rounded-[1.5rem] p-4 space-y-2.5 hover:border-white/15"
        >
          <p className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
            <PiggyBank size={13} className="text-emerald-400" /> Ahorro acumulado
          </p>
          <p className={`text-lg font-black font-mono leading-none ${saved >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
            {formatCLP(saved)}
          </p>
          <p className="text-[11px] font-bold text-slate-500">Meses cerrados</p>
        </Link>
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

      <AccountsChecklist items={accountItems(plan, v.checklist)} data={quick} month={month} />

      <BudgetPots rows={pots} data={quick} today={quick.today.slice(0, 7) === month.slice(0, 7) ? quick.today : month} />

      {/* ÚLTIMOS MOVIMIENTOS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] font-black text-white uppercase tracking-[0.15em]">Últimos movimientos</h2>
          <Link
            href={`/finanzas/movimientos?mes=${month.slice(0, 7)}`}
            className="min-h-11 inline-flex items-center gap-1 text-[10px] font-black text-indigo-400 uppercase tracking-wider"
          >
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>
        <ExpenseList items={recent} data={quick} />
      </section>
    </div>
  );
}
