import { CalendarCheck, Zap } from 'lucide-react';
import { PageHeader } from '@/components/ui/card';
import { formatCLP } from '@/lib/format';
import { monthShort } from '@/lib/plan/months';
import { debtItemsView, defaultMonth, loadPlanPage } from '@/services/plan';
import { SchemaMissingCard, SeedPlanCard } from '@/components/finanzas/seed-plan-card';
import DebtChart, { ITEM_COLORS } from './debt-chart';
import { AddDebtItem, CmrSettingsForm, DebtItemCard } from './debt-forms';

export const dynamic = 'force-dynamic';

export default async function DeudaCmrPage() {
  const { plan } = await loadPlanPage();

  const header = (
    <div className="space-y-3">
      <PageHeader title="Deuda CMR" subtitle="Plan para pagar la tarjeta" />
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

  const month = defaultMonth(plan);
  const items = debtItemsView(plan, month);
  const activeItems = plan.debtItems.filter((d) => !d.archived);
  const colorOf = new Map(activeItems.map((d, i) => [d.id, ITEM_COLORS[i % ITEM_COLORS.length]]));

  const total = plan.cmr.totalInitial;
  const paid = Math.min(total, plan.cmr.totalPaid);
  const pct = total > 0 ? paid / total : 0;
  const balance = items.reduce((a, i) => a + i.balance, 0);

  const thisMonth = plan.cmr.months.find((m) => m.month === month);
  const advances = items
    .filter((i) => i.thisMonth.advance > 0)
    .map((i) => `${formatCLP(i.thisMonth.advance)} al ${i.item.name}`);

  // Meses con pago (desde el inicio del plan CMR) para el gráfico y la tabla.
  const planMonths = plan.cmr.months.filter((m) => m.month >= plan.settings.cmrStartMonth && (m.total > 0.5 || m.paid > 0));
  const chartRows = planMonths.map((m) => {
    const row: Record<string, number | string> = { label: monthShort(m.month) };
    for (const d of activeItems) row[d.id] = Math.round(m.items[d.id]?.total ?? 0);
    return row;
  });

  return (
    <div className="space-y-8 pb-28">
      {header}

      {/* PROGRESO */}
      <section className="bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-rose-300/90 tracking-wide">Pagado del plan</p>
            <p className="mt-1.5 text-3xl sm:text-4xl font-semibold tabular-nums text-ink leading-none">
              {formatCLP(paid)} <span className="text-base text-ink-3">/ {formatCLP(total)}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-ink-2 tracking-wide">Termina</p>
            <p className="mt-1.5 flex items-center justify-end gap-1.5 text-lg font-semibold text-emerald-300">
              <CalendarCheck size={16} /> {plan.cmr.payoffMonth ? monthShort(plan.cmr.payoffMonth) : '—'}
            </p>
          </div>
        </div>
        <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full" style={{ width: `${Math.round(pct * 100)}%` }} />
        </div>
        <p className="text-xs font-bold text-ink-2">
          {Math.round(pct * 100)}% pagado · saldo {formatCLP(balance)}
        </p>
      </section>

      {/* ESTE MES */}
      <section className="flex items-start gap-3 bg-surface border border-line rounded-3xl p-5">
        <Zap size={18} className="text-amber-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-ink">
            {monthShort(month)}: paga {formatCLP(Math.round(thisMonth?.total ?? 0))}
          </p>
          <p className="text-sm text-ink-2">
            {month < plan.settings.cmrStartMonth
              ? `El plan parte en ${monthShort(plan.settings.cmrStartMonth)}. Este mes solo se paga la boleta actual.`
              : advances.length > 0
              ? `Este mes adelanta ${advances.join(' y ')}.`
              : 'Este mes solo se pagan las cuotas.'}
          </p>
        </div>
      </section>

      {/* GRÁFICO + TABLA */}
      {planMonths.length > 0 && (
        <section className="bg-surface border border-line rounded-3xl p-5 space-y-5">
          <h2 className="text-sm font-semibold text-ink tracking-wide">Plan mes a mes</h2>
          <DebtChart rows={chartRows} items={activeItems.map((d) => ({ id: d.id, name: d.name }))} />
          {/* Celular: una fila por mes, sin scroll horizontal */}
          <ul className="sm:hidden divide-y divide-line tabular-nums">
            {planMonths.map((m) => (
              <li key={m.month} className={`py-2.5 ${m.month === month ? 'text-ink' : 'text-ink-2'}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-semibold">
                    {monthShort(m.month)}
                    {m.source === 'real' && <span className="ml-1.5 text-xs text-emerald-400">real</span>}
                  </span>
                  <span className="text-[15px] font-semibold">{formatCLP(m.total)}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-3">
                  Cuotas {formatCLP(m.total - m.advance)}
                  {m.advance > 0.5 && <span className="text-amber-300"> · adelanto {formatCLP(m.advance)}</span>}
                  {' · '}queda {formatCLP(m.remainingAfter)}
                </p>
              </li>
            ))}
          </ul>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs ">
              <thead>
                <tr className="text-ink-3 text-xs tracking-wide">
                  <th className="text-left font-semibold py-2 pr-3">Mes</th>
                  <th className="text-right font-semibold py-2 px-2">Cuotas</th>
                  <th className="text-right font-semibold py-2 px-2">Adelanto</th>
                  <th className="text-right font-semibold py-2 px-2">Total</th>
                  <th className="text-right font-semibold py-2 pl-2">Deuda al cierre</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {planMonths.map((m) => (
                  <tr key={m.month} className={`border-t border-line ${m.month === month ? 'text-ink' : 'text-ink-2'}`}>
                    <td className="py-2 pr-3 font-sans font-bold">
                      {monthShort(m.month)}
                      {m.source === 'real' && <span className="ml-1.5 text-xs text-emerald-400">real</span>}
                    </td>
                    <td className="text-right py-2 px-2">{formatCLP(m.total - m.advance)}</td>
                    <td className="text-right py-2 px-2 text-amber-300">{m.advance > 0.5 ? formatCLP(m.advance) : '–'}</td>
                    <td className="text-right py-2 px-2 font-semibold">{formatCLP(m.total)}</td>
                    <td className="text-right py-2 pl-2 text-ink-3">{formatCLP(m.remainingAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ÍTEMS */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-ink tracking-wide px-1">Compras en cuotas</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {items.map((v) => (
            <DebtItemCard
              key={v.item.id}
              item={{
                id: v.item.id,
                name: v.item.name,
                price: v.item.price,
                installment: v.item.installment,
                total_installments: v.item.total_installments,
                remaining_installments: v.item.remaining_installments,
                priority: v.item.priority,
              }}
              color={colorOf.get(v.item.id) ?? ITEM_COLORS[0]}
              balance={v.balance}
              paid={v.paid}
              remainingInstallments={v.remainingInstallments}
              interest={v.interest}
              status={v.status}
              thisMonth={v.thisMonth}
            />
          ))}
        </div>
        <AddDebtItem nextPriority={activeItems.reduce((a, d) => Math.max(a, d.priority), 0) + 1} />
      </section>

      <CmrSettingsForm
        fixedPayment={plan.settings.cmrFixedPayment}
        startMonth={plan.settings.cmrStartMonth}
        months={plan.months.map((m) => ({ value: m, label: monthShort(m) }))}
      />

      <p className="text-xs text-ink-3 px-1">
        El pago del mes se marca en <span className="text-ink-2 font-bold">Mes → Cuentas del mes → Deuda CMR</span>. Si compras algo
        nuevo en cuotas, agrégalo aquí: sus cuotas se suman al plan y se recalcula solo.
      </p>
    </div>
  );
}
