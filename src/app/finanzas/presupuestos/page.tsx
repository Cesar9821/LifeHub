import { CalendarPlus, Download, PieChart, RotateCcw } from 'lucide-react';
import { formatCLP } from '@/lib/format';
import { budgetStatus } from '@/lib/plan/budget';
import { addMonths, monthShort } from '@/lib/plan/months';
import { defaultMonth, loadPlanPage, monthView } from '@/services/plan';
import { extendPlan, setConceptArchived } from '@/app/finanzas/plan/actions';
import MonthSelector from '@/app/finanzas/movimientos/month-selector';
import { SchemaMissingCard, SeedPlanCard } from '@/components/finanzas/seed-plan-card';
import { StatusChip, UsageBar } from '@/components/finanzas/status-chip';
import { SubmitButton } from '@/components/ui/submit-button';
import BudgetRow from './budget-row';
import ConceptForm from './concept-form';

export const dynamic = 'force-dynamic';

export default async function PresupuestoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const { plan } = await loadPlanPage();
  const month = defaultMonth(plan, params?.mes);

  const header = (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-line-strong bg-surface w-fit">
          <PieChart size={14} className="text-indigo-400" />
          <span className="text-xs font-bold text-ink-2 tracking-wide">Plan del hogar</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-ink tracking-tight leading-none">
          Presupuesto<span className="text-indigo-500">.</span>
        </h1>
      </div>
      {plan.seeded && <MonthSelector period={month} basePath="/finanzas/presupuestos" />}
    </div>
  );

  if (!plan.schemaReady || !plan.seeded || !plan.checklistReady) {
    return (
      <div className="space-y-8 pb-20 max-w-2xl">
        {header}
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

  const v = monthView(plan, month);
  const remaining = v.expenseBudget - v.spent;
  const totalStatus = budgetStatus(v.expenseBudget, v.spent);
  const archived = plan.concepts.filter((c) => c.archived);
  const groupNames = [...new Set(plan.concepts.map((c) => c.group_name))];
  const lastMonth = plan.months[plan.months.length - 1];

  return (
    <div className="space-y-8 pb-28">
      {header}

      {/* RESUMEN DEL MES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Ingresos" value={formatCLP(v.income)} tone="text-emerald-300" />
        <Tile label="Presupuestado" value={formatCLP(v.expenseBudget)} tone="text-ink" />
        <Tile label="Gastado" value={formatCLP(v.spent)} tone="text-rose-300" />
        <Tile
          label={remaining >= 0 ? 'Queda del presupuesto' : 'Sobre el presupuesto'}
          value={formatCLP(Math.abs(remaining))}
          tone={remaining >= 0 ? 'text-ink' : 'text-rose-400'}
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <UsageBar used={v.expenseBudget > 0 ? v.spent / v.expenseBudget : 0} status={totalStatus} />
        </div>
        <StatusChip status={totalStatus} />
      </div>

      {/* INGRESOS */}
      <Section title="Ingresos" subtitle={formatCLP(v.income)}>
        {v.incomes.map((r) => (
          <BudgetRow
            key={r.concept.id}
            conceptId={r.concept.id}
            name={r.concept.name}
            group={r.concept.group_name}
            month={month}
            kind="income"
            budget={r.budget}
            actual={r.actual}
            person={r.concept.person}
            payMode={r.concept.pay_mode}
            dueDay={r.concept.due_day}
            payState={v.checklist.find((i) => i.conceptId === r.concept.id)?.state ?? null}
          />
        ))}
        {v.otherIncome > 0 && (
          <p className="text-xs text-ink-3 px-1">+ {formatCLP(v.otherIncome)} en ingresos sin concepto.</p>
        )}
      </Section>

      {/* GASTOS POR GRUPO */}
      {v.groups.map((g) => (
        <Section key={g.group} title={g.group} subtitle={`${formatCLP(g.spent)} de ${formatCLP(g.budget)}`}>
          {g.rows.map((r) => (
            <BudgetRow
              key={r.concept.id}
              conceptId={r.concept.id}
              name={r.concept.name}
              group={r.concept.group_name}
              month={month}
              kind="expense"
              budget={r.budget}
              actual={r.spent}
              status={r.status}
              used={r.used}
              isDebtPlan={r.concept.is_debt_plan}
              payMode={r.concept.pay_mode}
              dueDay={r.concept.due_day}
              payState={r.payState}
            />
          ))}
        </Section>
      ))}

      {v.unassignedSpent > 0 && (
        <p className="text-sm text-ink-2 bg-surface border border-line rounded-2xl p-4">
          <span className="font-semibold text-ink">{formatCLP(v.unassignedSpent)}</span> en gastos sin concepto (por
          ejemplo, sincronizados de Mercado Pago). Edítalos desde Movimientos para asignarles uno.
        </p>
      )}

      <ConceptForm month={month} groups={groupNames} people={plan.settings.people} />

      {/* ARCHIVADOS */}
      {archived.length > 0 && (
        <Section title="Archivados" subtitle={`${archived.length}`}>
          {archived.map((c) => (
            <form key={c.id} action={setConceptArchived} className="flex items-center justify-between gap-3 bg-black/20 border border-line rounded-2xl pl-4 pr-2 py-1">
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="archived" value="false" />
              <span className="text-sm text-ink-2 truncate">
                {c.name} <span className="text-ink-3">· {c.group_name}</span>
              </span>
              <SubmitButton className="min-h-11 bg-transparent text-ink-2 hover:text-ink hover:bg-white/5 px-3">
                <RotateCcw size={13} /> Restaurar
              </SubmitButton>
            </form>
          ))}
        </Section>
      )}

      {/* MESES Y RESPALDO */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form action={extendPlan} className="flex-1">
          <SubmitButton pendingText="Agregando…" className="w-full min-h-12 bg-white/5 text-ink-2 border border-line-strong hover:bg-white/10 hover:text-ink">
            <CalendarPlus size={15} /> Agregar {monthShort(addMonths(lastMonth, 1))} al plan
          </SubmitButton>
        </form>
        <a
          href="/api/export?tipo=gastos"
          className="flex-1 min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-line-strong text-xs font-semibold text-ink-2 tracking-wide hover:bg-white/5"
        >
          <Download size={15} /> Gastos CSV
        </a>
        <a
          href="/api/export?tipo=presupuesto"
          className="flex-1 min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-line-strong text-xs font-semibold text-ink-2 tracking-wide hover:bg-white/5"
        >
          <Download size={15} /> Presupuesto CSV
        </a>
      </div>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-4">
      <p className="text-xs font-semibold text-ink-3 tracking-wide">{label}</p>
      <p className={`mt-1.5 text-lg sm:text-xl font-semibold tabular-nums leading-none break-all ${tone}`}>{value}</p>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h2 className="text-xs font-semibold text-ink tracking-wide">{title}</h2>
        <span className="text-xs font-bold text-ink-3 tabular-nums">{subtitle}</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">{children}</div>
    </section>
  );
}
