import { BarChart3, Download, Users } from 'lucide-react';
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
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/50 w-fit">
        <BarChart3 size={14} className="text-emerald-400" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          {plan.months.length > 0 ? `${monthShort(plan.months[0])} – ${monthShort(plan.months[plan.months.length - 1])}` : 'Plan del hogar'}
        </span>
      </div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter italic leading-none">
        Resumen anual<span className="text-emerald-500">.</span>
      </h1>
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
        <Tile label="Gastos presupuestados" value={formatCLP(totals.expenseBudget)} tone="text-white" />
        <Tile label="Ahorro al cierre" value={formatCLP(rows[rows.length - 1]?.accumulated ?? 0)} tone="text-amber-300" />
        <Tile
          label="Deudas / ingreso"
          value={pct(totals.income > 0 ? totals.debt / totals.income : 0)}
          tone={totals.income > 0 && totals.debt / totals.income > DEBT_LIMIT ? 'text-rose-400' : 'text-white'}
        />
      </div>

      <section className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-5">
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
      <section className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-5 space-y-3">
        <h2 className="text-sm font-black text-white uppercase tracking-wider">Mes a mes</h2>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-xs min-w-[760px]">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase tracking-wider">
                <th className="text-left font-black py-2 pr-3">Mes</th>
                <th className="text-right font-black py-2 px-2">Ingresos</th>
                <th className="text-right font-black py-2 px-2">Presupuestado</th>
                <th className="text-right font-black py-2 px-2">Gastado real</th>
                <th className="text-right font-black py-2 px-2">Saldo del mes</th>
                <th className="text-right font-black py-2 px-2">Ahorro acum.</th>
                <th className="text-right font-black py-2 px-2">Pago CMR</th>
                <th className="text-right font-black py-2 pl-2">% en deuda</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {rows.map((r) => {
                const overDebt = r.debtPct > DEBT_LIMIT;
                return (
                  <tr key={r.month} className={`border-t border-white/5 ${r.month === month ? 'text-white' : 'text-slate-300'}`}>
                    <td className="py-2 pr-3 font-sans font-bold whitespace-nowrap">
                      {monthShort(r.month)}
                      {r.projected && <span className="ml-1.5 text-[9px] text-slate-500 uppercase">proy.</span>}
                    </td>
                    <td className="text-right py-2 px-2 text-emerald-300">{formatCLP(r.income)}</td>
                    <td className="text-right py-2 px-2">{formatCLP(r.expenseBudget)}</td>
                    <td className="text-right py-2 px-2 text-rose-300">{formatCLP(r.spent)}</td>
                    <td className={`text-right py-2 px-2 font-black ${r.balance < 0 ? 'text-rose-400' : ''}`}>{formatCLP(r.balance)}</td>
                    <td className="text-right py-2 px-2 text-amber-300">{formatCLP(r.accumulated)}</td>
                    <td className="text-right py-2 px-2">{formatCLP(r.debtPayment)}</td>
                    <td className={`text-right py-2 pl-2 font-black ${overDebt ? 'text-rose-400' : 'text-slate-400'}`}>
                      {pct(r.debtPct)}
                      {overDebt && ' ⚠'}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-white/10 text-white font-black">
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
        <p className="text-[11px] text-slate-500">
          Meses cerrados con lo gastado de verdad; el mes actual y los siguientes (proy.) con el presupuesto. Sobre{' '}
          {pct(DEBT_LIMIT)} del ingreso en deudas se marca en rojo.
        </p>
      </section>

      {/* APORTE PROPORCIONAL */}
      <section className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-5 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-black text-white uppercase tracking-wider">
          <Users size={16} className="text-indigo-400" /> Aporte de cada uno
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {people.map((person) => {
            const c = current?.contributions.find((x) => x.person === person);
            return (
              <div key={person} className="bg-black/20 border border-white/5 rounded-2xl p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <p className="text-base font-black text-white">{person}</p>
                  <p className="text-2xl font-black text-indigo-300">{pct(c?.pct ?? 0)}</p>
                </div>
                <p className="text-sm text-slate-300">
                  Aporta <span className="font-black text-white font-mono">{formatCLP(c?.amount ?? 0)}</span> en {monthShort(current.month)}
                </p>
                <p className="text-[11px] text-slate-500">
                  Sueldo {formatCLP(c?.income ?? 0)} · promedio del periodo {formatCLP(avgAmount(person))}/mes
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500">
          Cada uno aporta a los gastos presupuestados según lo que gana: su sueldo / el total de sueldos del mes.
        </p>
      </section>

      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href="/api/export?tipo=gastos"
          className="flex-1 min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 text-xs font-black text-slate-300 uppercase tracking-wider hover:bg-white/5"
        >
          <Download size={15} /> Exportar gastos (CSV)
        </a>
        <a
          href="/api/export?tipo=presupuesto"
          className="flex-1 min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 text-xs font-black text-slate-300 uppercase tracking-wider hover:bg-white/5"
        >
          <Download size={15} /> Exportar presupuesto (CSV)
        </a>
      </div>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-[1.5rem] p-4">
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">{label}</p>
      <p className={`mt-1.5 text-lg sm:text-xl font-black font-mono leading-none break-all ${tone}`}>{value}</p>
    </div>
  );
}
