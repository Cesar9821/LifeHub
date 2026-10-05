/**
 * "¿Cómo estamos este mes?" y "¿Puedo gastar esto?".
 * Recomendación basada en los datos del plan, no una decisión absoluta.
 * No cambia ninguna regla existente: se calcula SOBRE el resultado de monthView.
 */

export interface AccountLine {
  kind: 'income' | 'expense';
  state: 'pagado' | 'vencido' | 'vence_hoy' | 'por_pagar';
  /** Monto presupuestado de la cuenta (o cuota del plan CMR). */
  amount: number;
  /** Lo ya pagado este mes. */
  paid: number;
}

export interface PotLine {
  conceptId: string;
  name: string;
  budget: number;
  spent: number;
}

export interface MonthMoney {
  income: number;
  spent: number;
  /** Ingresos − gastado (lo que muestra Finanzas como Disponible). */
  available: number;
  /** Cuentas del mes que aún no se pagan (incluye cuotas CMR pendientes). */
  committed: number;
  /** Lo que falta de los gastos variables presupuestados (súper, ocio…). */
  variableLeft: number;
  /** Disponible − comprometido − gastos variables por venir = ahorro proyectado del mes. */
  margin: number;
}

export function monthMoney(input: {
  income: number;
  spent: number;
  accounts: AccountLine[];
  pots: Pick<PotLine, 'budget' | 'spent'>[];
}): MonthMoney {
  const available = input.income - input.spent;
  const committed = input.accounts
    .filter((a) => a.kind === 'expense' && a.state !== 'pagado')
    .reduce((acc, a) => acc + Math.max(0, a.amount - a.paid), 0);
  const variableLeft = input.pots.reduce((acc, p) => acc + Math.max(0, p.budget - p.spent), 0);
  return {
    income: input.income,
    spent: input.spent,
    available,
    committed,
    variableLeft,
    margin: available - committed - variableLeft,
  };
}

export type AffordLevel = 'si' | 'ojo' | 'no';

export interface AffordResult {
  level: AffordLevel;
  amount: number;
  /** Disponible del mes después del gasto. */
  availableAfter: number;
  /** Margen libre después de cubrir cuentas y gastos variables por venir. */
  marginAfter: number;
  /** Parte del gasto que cabe en lo que queda del concepto elegido. */
  coveredByPot: number;
  cushion: number;
}

/** Colchón recomendado: 10% de los ingresos del mes. */
export const CUSHION_RATIO = 0.1;

/**
 * 🟢 si: después del gasto queda al menos el colchón libre.
 * 🟡 ojo: alcanza, pero el margen queda bajo el colchón.
 * 🔴 no: no alcanza sin tocar lo comprometido o el ahorro.
 * Si el gasto es de un concepto variable con saldo (ej. Supermercado), lo que
 * cabe en ese saldo ya estaba considerado y no resta margen de nuevo.
 */
export function canAfford(money: MonthMoney, amount: number, potLeft = 0, cushionRatio = CUSHION_RATIO): AffordResult {
  const value = Math.max(0, Math.round(amount));
  const coveredByPot = Math.min(value, Math.max(0, potLeft));
  const marginAfter = money.margin - (value - coveredByPot);
  const cushion = Math.max(0, Math.round(money.income * cushionRatio));
  const level: AffordLevel = marginAfter >= cushion ? 'si' : marginAfter >= 0 ? 'ojo' : 'no';
  return { level, amount: value, availableAfter: money.available - value, marginAfter, coveredByPot, cushion };
}
