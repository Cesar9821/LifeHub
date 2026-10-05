import { cache } from 'react';
import { accountItems, loadPlan, monthView, savedBefore, defaultMonth } from './plan';
import { monthMoney, type MonthMoney, type PotLine } from '@/lib/plan/afford';

export interface FinanceSnapshot {
  ready: boolean;
  month: string;
  money: MonthMoney;
  /** Ahorro acumulado de los meses cerrados. */
  saved: number;
  /** Gastos variables con saldo (para "¿Puedo gastar esto?"). */
  pots: PotLine[];
  /** Cuentas vencidas o que vencen hoy. */
  dueNow: { label: string; amount: number; state: 'vencido' | 'vence_hoy' }[];
  /** Cuentas por pagar este mes (sin contar vencidas/hoy). */
  pendingCount: number;
}

const EMPTY: MonthMoney = { income: 0, spent: 0, available: 0, committed: 0, variableLeft: 0, margin: 0 };

/**
 * Resumen del mes para Hoy y "¿Puedo gastar esto?". Reutiliza loadPlan y
 * monthView tal cual (misma lógica que Finanzas): no hay un cálculo paralelo.
 */
export const loadFinanceSnapshot = cache(async (requestedMonth?: string): Promise<FinanceSnapshot> => {
  const plan = await loadPlan();
  const month = defaultMonth(plan, requestedMonth);
  if (!plan.schemaReady || !plan.seeded) {
    return { ready: false, month, money: EMPTY, saved: 0, pots: [], dueNow: [], pendingCount: 0 };
  }
  const v = monthView(plan, month);
  const rows = v.groups.flatMap((g) => g.rows);
  const pots: PotLine[] = rows
    .filter((r) => r.concept.pay_mode === 'bolsa' && r.budget > 0)
    .map((r) => ({ conceptId: r.concept.id, name: r.concept.name, budget: r.budget, spent: r.spent }));

  const money = monthMoney({
    income: v.income,
    spent: v.spent,
    accounts: v.checklist.map((c) => ({ kind: c.kind, state: c.state, amount: c.amount, paid: c.paid })),
    pots,
  });

  // Misma agrupación que "Cuentas del mes" (las cuotas CMR en una sola línea).
  const expenses = accountItems(plan, v.checklist).filter((c) => c.kind === 'expense');
  return {
    ready: true,
    month,
    money,
    saved: savedBefore(plan, month),
    pots,
    dueNow: expenses
      .filter((c) => c.state === 'vencido' || c.state === 'vence_hoy')
      .map((c) => ({
        label: c.label,
        amount: c.pendingAmount ?? Math.max(0, c.amount - c.paid),
        state: c.state as 'vencido' | 'vence_hoy',
      })),
    pendingCount: expenses.filter((c) => c.state === 'por_pagar').length,
  };
});
