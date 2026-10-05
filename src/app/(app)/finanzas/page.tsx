import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
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
import { MonthSummary } from '@/components/finanzas/month-summary';
import { AffordCheck } from '@/components/finanzas/afford-check';
import { monthMoney } from '@/lib/plan/afford';

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

  // "¿Cómo estamos?" y "¿Puedo gastar?" se calculan SOBRE monthView (misma lógica).
  const affordPots = pots.filter((p) => p.budget > 0).map(({ conceptId, name, budget, spent }) => ({ conceptId, name, budget, spent }));
  const money = monthMoney({
    income: v.income,
    spent: v.spent,
    accounts: v.checklist.map((c) => ({ kind: c.kind, state: c.state, amount: c.amount, paid: c.paid })),
    pots: affordPots,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-4">
        <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-ink">¿Cómo estamos este mes?</h1>
        <MonthSelector period={month} basePath="/finanzas" />
      </div>

      <MonthSummary money={money} saved={saved} expenseBudget={v.expenseBudget} status={totalStatus} month={month} />

      {v.isCurrent && <AffordCheck money={money} pots={affordPots} />}

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
