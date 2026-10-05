import Link from 'next/link';
import { formatCLP } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { MonthMoney } from '@/lib/plan/afford';
import type { BudgetStatus } from '@/lib/plan/budget';
import { UsageBar } from './status-chip';

function Tile({ label, value, hint, tone, href }: { label: string; value: number; hint?: string; tone?: string; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-ink-3">{label}</p>
      <p className={cn('text-lg font-semibold tabular-nums leading-tight', tone ?? 'text-ink')}>{formatCLP(value)}</p>
      {hint && <p className="text-xs text-ink-3">{hint}</p>}
    </>
  );
  const cls = 'block bg-surface border border-line rounded-2xl p-4 space-y-0.5';
  return href ? (
    <Link href={href} className={cn(cls, 'hover:border-line-strong')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** "¿Cómo estamos este mes?": un número grande y cuatro de apoyo. Sin gráficos de más. */
export function MonthSummary({
  money,
  saved,
  expenseBudget,
  status,
  month,
}: {
  money: MonthMoney;
  saved: number;
  expenseBudget: number;
  status: BudgetStatus;
  month: string;
}) {
  const pct = expenseBudget > 0 ? Math.round((money.spent / expenseBudget) * 100) : 0;
  return (
    <section aria-label="¿Cómo estamos este mes?" className="space-y-3">
      <div className="bg-surface border border-line rounded-3xl p-5 space-y-3">
        <p className="text-sm text-ink-3">Plata disponible este mes</p>
        <p className={cn('text-[40px] leading-none font-semibold tracking-tight tabular-nums break-all', money.available >= 0 ? 'text-ink' : 'text-danger')}>
          {formatCLP(money.available)}
        </p>
        <div className="space-y-1.5">
          <UsageBar used={expenseBudget > 0 ? money.spent / expenseBudget : 0} status={status} />
          <p className="text-sm text-ink-2">
            Gastado {formatCLP(money.spent)} de {formatCLP(expenseBudget)} presupuestado{expenseBudget > 0 && ` · ${pct}%`}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Tile label="Ingresos" value={money.income} hint="Lo recibido o lo esperado" />
        <Tile label="Gastado" value={money.spent} href={`/finanzas/movimientos?mes=${month.slice(0, 7)}`} />
        <Tile label="Comprometido" value={money.committed} hint="Cuentas aún por pagar" tone={money.committed > 0 ? 'text-warning' : undefined} />
        <Tile
          label="Ahorro del mes"
          value={money.margin}
          hint={`Proyectado · acumulado ${formatCLP(saved)}`}
          tone={money.margin >= 0 ? 'text-success' : 'text-danger'}
          href="/finanzas/resumen"
        />
      </div>
    </section>
  );
}
