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
import MonthSelector from '@/app/(app)/finanzas/movimientos/month-selector';
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
        <h1 className="text-3xl font-semibold text-ink tracking-tight">
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
        <p className="text-sm font-bold text-ink-2">{firstName ? `Hola, ${firstName} 👋` : 'Hola 👋'}</p>
        <MonthSelector period={month} basePath="/finanzas" />
      </div>

      {/* DISPONIBLE */}
      <section className="bg-gradient-to-br from-indigo-500/15 to-transparent border border-indigo-500/25 rounded-3xl p-6">
        <p className="flex items-center gap-2 text-xs font-semibold text-indigo-300/90 tracking-wide">
          <Wallet size={14} /> Disponible este mes
        </p>
        <p className={`mt-2 text-4xl font-semibold tabular-nums leading-none break-all ${v.available >= 0 ? 'text-ink' : 'text-rose-400'}`}>
          {formatCLP(v.available)}
        </p>
        <p className="mt-3 text-xs font-bold text-ink-2">
          Ingresos {formatCLP(v.income)} · gastado {formatCLP(v.spent)}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/finanzas/presupuestos?mes=${month.slice(0, 7)}`}
          className="bg-surface border border-line rounded-2xl p-4 space-y-2.5 hover:border-white/15"
        >
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-2 tracking-wide">
            <TrendingDown size={13} className="text-rose-400" /> Gastado vs plan
          </p>
          <p className="text-lg font-semibold tabular-nums text-ink leading-none">{formatCLP(v.spent)}</p>
          <UsageBar used={v.expenseBudget > 0 ? v.spent / v.expenseBudget : 0} status={totalStatus} />
          <p className="text-xs font-bold text-ink-3">
            de {formatCLP(v.expenseBudget)}
            {v.expenseBudget > 0 && ` · ${Math.round((v.spent / v.expenseBudget) * 100)}%`}
          </p>
        </Link>
        <Link
          href="/finanzas/resumen"
          className="bg-surface border border-line rounded-2xl p-4 space-y-2.5 hover:border-white/15"
        >
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-2 tracking-wide">
            <PiggyBank size={13} className="text-emerald-400" /> Ahorro acumulado
          </p>
          <p className={`text-lg font-semibold tabular-nums leading-none ${saved >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
            {formatCLP(saved)}
          </p>
          <p className="text-xs font-bold text-ink-3">Meses cerrados</p>
        </Link>
      </div>

      {/* ALERTAS */}
      {v.alerts.length > 0 && (
        <section className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-2">
          <p className="flex items-center gap-2 text-xs font-semibold text-amber-300 tracking-wide">
            <AlertTriangle size={14} /> Atención
          </p>
          <ul className="space-y-1.5">
            {v.alerts.map((a) => (
              <li key={a.concept.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink font-bold truncate">{a.concept.name}</span>
                <span className={`text-xs font-semibold shrink-0 ${a.status === 'cerca' ? 'text-amber-300' : 'text-rose-300'}`}>
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
          <h2 className="text-xs font-semibold text-ink tracking-wide">Últimos movimientos</h2>
          <Link
            href={`/finanzas/movimientos?mes=${month.slice(0, 7)}`}
            className="min-h-11 inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 tracking-wide"
          >
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>
        <ExpenseList items={recent} data={quick} />
      </section>
    </div>
  );
}
