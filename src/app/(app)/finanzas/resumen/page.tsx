import { Download, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/card';
import { formatCLP } from '@/lib/format';
import { monthShort } from '@/lib/plan/months';
import { defaultMonth, loadPlanPage, yearView } from '@/services/plan';
import { SchemaMissingCard, SeedPlanCard } from '@/components/finanzas/seed-plan-card';
import YearChart from './year-chart';

export const dynamic = 'force-dynamic';

/** Sobre este % del ingreso, las deudas se destacan. */
const DEBT_LIMIT = 0.3;

const pct = (n: number) => `${Math.round(n * 100)}%`;

export default async function ResumenPage() {
  const { plan } = await loadPlanPage();

  const header = (
    <div className="space-y-3">
      <PageHeader title="Resumen anual" subtitle={plan.months.length > 0 ? `${monthShort(plan.months[0])} – ${monthShort(plan.months[plan.months.length - 1])}` : undefined} />
    </div>
  );

  if (!plan.schemaReady || !plan.seeded) {
    return (
      <div className="space-y-8 pb-20 max-w-2xl">
        {header}
        {!plan.schemaReady ? <SchemaMissingCard /> : <SeedPlanCard />}
      </div>
    );
  }

  const rows = yearView(plan);
  const totals = rows.reduce(
    (a, r) => ({
      income: a.income + r.income,
      expenseBudget: a.expenseBudget + r.expenseBudget,
      spent: a.spent + r.spent,
      balance: a.balance + r.balance,
      debt: a.debt + r.debtPayment,
    }),
    { income: 0, expenseBudget: 0, spent: 0, balance: 0, debt: 0 }
  );

  // Aporte: el del mes actual y el promedio del periodo.
  const month = defaultMonth(plan);
  const current = rows.find((r) => r.month === month) ?? rows[0];
  const people = plan.settings.people;
  const avgAmount = (person: string) =>
    rows.reduce((a, r) => a + (r.contributions.find((c) => c.person === person)?.amount ?? 0), 0) / Math.max(1, rows.length);

  return (
    <div className="space-y-8 pb-28">
      {header}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Ingresos del periodo" value={formatCLP(totals.income)} tone="text-emerald-300" />
        <Tile label="Gastos presupuestados" value={formatCLP(totals.expenseBudget)} tone="text-ink" />
        <Tile label="Ahorro al cierre" value={formatCLP(rows[rows.length - 1]?.accumulated ?? 0)} tone="text-amber-300" />
        <Tile
          label="Deudas / ingreso"
          value={pct(totals.income > 0 ? totals.debt / totals.income : 0)}
          tone={totals.income > 0 && totals.debt / totals.income > DEBT_LIMIT ? 'text-rose-400' : 'text-ink'}
        />
      </div>

      <section className="bg-surface border border-line rounded-3xl p-5">
        <YearChart
          rows={rows.map((r) => ({
            label: monthShort(r.month).replace(' 20', " '"),
            ingresos: Math.round(r.income),
            presupuesto: Math.round(r.expenseBudget),
            gastado: Math.round(r.spent),
            acumulado: Math.round(r.accumulated),
          }))}
        />
      </section>

      {/* TABLA MES A MES */}
      <section className="bg-surface border border-line rounded-3xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-ink tracking-wide">Mes a mes</h2>
        {/* Celular: tarjetas por mes (sin scroll horizontal) */}
        <ul className="xl:hidden divide-y divide-line tabular-nums">
          {rows.map((r) => {
            const overDebt = r.debtPct > DEBT_LIMIT;
            return (
              <li key={r.month} className={`py-3 ${r.month === month ? 'text-ink' : 'text-ink-2'}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-semibold">
                    {monthShort(r.month)}
                    {r.projected && <span className="ml-1.5 text-xs font-normal text-ink-3">proyectado</span>}
                  </span>
                  <span className={`text-[15px] font-semibold ${r.balance < 0 ? 'text-rose-400' : ''}`}>{formatCLP(r.balance)}</span>
                </div>
                <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                  <dt className="text-ink-3">Ingresos</dt>
                  <dd className="text-right text-emerald-300">{formatCLP(r.income)}</dd>
                  <dt className="text-ink-3">{r.projected ? 'Presupuestado' : 'Gastado'}</dt>
                  <dd className="text-right text-rose-300">{formatCLP(r.projected ? Math.max(r.expenseBudget, r.spent) : r.spent)}</dd>
                  <dt className="text-ink-3">Ahorro acumulado</dt>
                  <dd className="text-right text-amber-300">{formatCLP(r.accumulated)}</dd>
                  <dt className="text-ink-3">Pago CMR</dt>
                  <dd className={`text-right ${overDebt ? 'text-rose-400' : ''}`}>
                    {formatCLP(r.debtPayment)} · {pct(r.debtPct)}
                    {overDebt && ' ⚠'}
                  </dd>
                </dl>
              </li>
            );
          })}
          <li className="py-3 text-ink font-semibold flex items-baseline justify-between gap-3">
            <span>Total del período</span>
            <span>{formatCLP(totals.balance)}</span>
          </li>
        </ul>
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-ink-3 text-xs tracking-wide">
                <th className="text-left font-semibold py-2 pr-3">Mes</th>
                <th className="text-right font-semibold py-2 px-2">Ingresos</th>
                <th className="text-right font-semibold py-2 px-2">Presupuestado</th>
                <th className="text-right font-semibold py-2 px-2">Gastado real</th>
                <th className="text-right font-semibold py-2 px-2">Saldo del mes</th>
                <th className="text-right font-semibold py-2 px-2">Ahorro acum.</th>
                <th className="text-right font-semibold py-2 px-2">Pago CMR</th>
                <th className="text-right font-semibold py-2 pl-2">% en deuda</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.map((r) => {
                const overDebt = r.debtPct > DEBT_LIMIT;
                return (
                  <tr key={r.month} className={`border-t border-line ${r.month === month ? 'text-ink' : 'text-ink-2'}`}>
                    <td className="py-2 pr-3 font-sans font-bold whitespace-nowrap">
                      {monthShort(r.month)}
                      {r.projected && <span className="ml-1.5 text-xs text-ink-3">proy.</span>}
                    </td>
                    <td className="text-right py-2 px-2 text-emerald-300">{formatCLP(r.income)}</td>
                    <td className="text-right py-2 px-2">{formatCLP(r.expenseBudget)}</td>
                    <td className="text-right py-2 px-2 text-rose-300">{formatCLP(r.spent)}</td>
                    <td className={`text-right py-2 px-2 font-semibold ${r.balance < 0 ? 'text-rose-400' : ''}`}>{formatCLP(r.balance)}</td>
                    <td className="text-right py-2 px-2 text-amber-300">{formatCLP(r.accumulated)}</td>
                    <td className="text-right py-2 px-2">{formatCLP(r.debtPayment)}</td>
                    <td className={`text-right py-2 pl-2 font-semibold ${overDebt ? 'text-rose-400' : 'text-ink-2'}`}>
                      {pct(r.debtPct)}
                      {overDebt && ' ⚠'}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-line-strong text-ink font-semibold">
                <td className="py-2 pr-3 font-sans">Total</td>
                <td className="text-right py-2 px-2">{formatCLP(totals.income)}</td>
                <td className="text-right py-2 px-2">{formatCLP(totals.expenseBudget)}</td>
                <td className="text-right py-2 px-2">{formatCLP(totals.spent)}</td>
                <td className="text-right py-2 px-2">{formatCLP(totals.balance)}</td>
                <td className="text-right py-2 px-2">{formatCLP(rows[rows.length - 1]?.accumulated ?? 0)}</td>
                <td className="text-right py-2 px-2">{formatCLP(totals.debt)}</td>
                <td className="text-right py-2 pl-2">{pct(totals.income > 0 ? totals.debt / totals.income : 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink-3">
          Meses cerrados con lo gastado de verdad; el mes actual y los siguientes (proy.) con el presupuesto. Sobre{' '}
          {pct(DEBT_LIMIT)} del ingreso en deudas se marca en rojo.
        </p>
      </section>

      {/* APORTE PROPORCIONAL */}
      <section className="bg-surface border border-line rounded-3xl p-5 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink tracking-wide">
          <Users size={16} className="text-indigo-400" /> Aporte de cada uno
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {people.map((person) => {
            const c = current?.contributions.find((x) => x.person === person);
            return (
              <div key={person} className="bg-black/20 border border-line rounded-2xl p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <p className="text-base font-semibold text-ink">{person}</p>
                  <p className="text-2xl font-semibold text-indigo-300">{pct(c?.pct ?? 0)}</p>
                </div>
                <p className="text-sm text-ink-2">
                  Aporta <span className="font-semibold text-ink tabular-nums">{formatCLP(c?.amount ?? 0)}</span> en {monthShort(current.month)}
                </p>
                <p className="text-xs text-ink-3">
                  Sueldo {formatCLP(c?.income ?? 0)} · promedio del periodo {formatCLP(avgAmount(person))}/mes
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-ink-3">
          Cada uno aporta a los gastos presupuestados según lo que gana: su sueldo / el total de sueldos del mes.
        </p>
      </section>

      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href="/api/export?tipo=gastos"
          className="flex-1 min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-line-strong text-xs font-semibold text-ink-2 tracking-wide hover:bg-white/5"
        >
          <Download size={15} /> Exportar gastos (CSV)
        </a>
        <a
          href="/api/export?tipo=presupuesto"
          className="flex-1 min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-line-strong text-xs font-semibold text-ink-2 tracking-wide hover:bg-white/5"
        >
          <Download size={15} /> Exportar presupuesto (CSV)
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
