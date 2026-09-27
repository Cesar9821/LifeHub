/**
 * Reglas del plan: estado de un concepto en el mes y aporte proporcional.
 */

export type BudgetStatus = 'ok' | 'cerca' | 'pasado' | 'sin_presupuesto' | 'sin_movimiento';

/** Desde este % de uso el concepto queda "Cerca del límite". */
export const NEAR_LIMIT = 0.85;

/**
 * - OK: gastado < 85% del presupuesto
 * - Cerca del límite: desde el 85% hasta el 100%
 * - Pasado: supera el 100%
 * - Sin presupuesto: hay gasto y el presupuesto es 0
 */
export function budgetStatus(budget: number, spent: number): BudgetStatus {
  if (budget <= 0) return spent > 0 ? 'sin_presupuesto' : 'sin_movimiento';
  const used = spent / budget;
  if (used > 1) return 'pasado';
  if (used >= NEAR_LIMIT) return 'cerca';
  return 'ok';
}

export const STATUS_LABEL: Record<BudgetStatus, string> = {
  ok: 'OK',
  cerca: 'Cerca del límite',
  pasado: 'Pasado',
  sin_presupuesto: 'Sin presupuesto',
  sin_movimiento: '—',
};

export interface PersonIncome {
  person: string;
  income: number;
}

export interface Contribution {
  person: string;
  income: number;
  /** 0..1 */
  pct: number;
  /** Aporte sugerido a los gastos del mes, en pesos. */
  amount: number;
}

/**
 * Cada uno aporta según su sueldo: pct = sueldo / total de sueldos del mes.
 * Los montos se redondean al peso y el último absorbe la diferencia, para
 * que la suma calce exacto con el total de gastos.
 */
export function contributionSplit(incomes: PersonIncome[], expenses: number): Contribution[] {
  const total = incomes.reduce((a, b) => a + Math.max(0, b.income), 0);
  const rows = incomes.map((p) => {
    const pct = total > 0 ? Math.max(0, p.income) / total : 0;
    return { person: p.person, income: p.income, pct, amount: Math.round(expenses * pct) };
  });
  if (total > 0 && rows.length > 0) {
    const diff = Math.round(expenses) - rows.reduce((a, b) => a + b.amount, 0);
    rows[rows.length - 1].amount += diff;
  }
  return rows;
}
