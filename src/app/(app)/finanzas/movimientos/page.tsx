import { Download } from 'lucide-react';
import { PageHeader } from '@/components/ui/card';
import { formatCLP } from '@/lib/format';
import { defaultMonth, expenseListItems, loadPlanPage, monthView } from '@/services/plan';
import { MovementsBrowser } from '@/components/finanzas/movements-browser';
import { SchemaMissingCard, SeedPlanCard } from '@/components/finanzas/seed-plan-card';
import MonthSelector from './month-selector';

export const dynamic = 'force-dynamic';

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const { plan, registrantById, quick } = await loadPlanPage();

  const header = (
    <div className="space-y-3">
      <PageHeader title="Movimientos" subtitle="Todo lo registrado del mes" />
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

  const month = defaultMonth(plan, params?.mes);
  const v = monthView(plan, month);
  const items = expenseListItems(plan, v.movements, registrantById);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-28">
      {header}
      <MonthSelector period={month} basePath="/finanzas/movimientos" />

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Ingresos" value={formatCLP(v.income)} tone="text-emerald-300" />
        <Stat label="Gastado" value={formatCLP(v.spent)} tone="text-rose-300" />
        <Stat label="Disponible" value={formatCLP(v.available)} tone={v.available >= 0 ? 'text-ink' : 'text-rose-400'} />
      </div>

      <MovementsBrowser items={items} data={quick} />

      <a
        href="/api/export?tipo=gastos"
        className="w-full min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-line-strong text-xs font-semibold text-ink-2 tracking-wide hover:bg-white/5"
      >
        <Download size={15} /> Exportar a CSV
      </a>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-3">
      <p className="text-xs font-semibold text-ink-3 tracking-wide">{label}</p>
      <p className={`mt-1 text-sm sm:text-base font-semibold tabular-nums leading-none break-all ${tone}`}>{value}</p>
    </div>
  );
}
