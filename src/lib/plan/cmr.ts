import { addMonths } from './months';

/**
 * Plan de pago de la deuda CMR (compras de la casa).
 *
 * Cada mes, desde el mes de inicio:
 *   1. cuota_mes = min(cuota, saldo al inicio del mes)
 *   2. disponible = pago fijo − Σ cuotas
 *   3. el disponible se reparte como adelanto por prioridad (1 primero):
 *      cada ítem recibe min(saldo después de la cuota, disponible restante)
 *   4. saldo siguiente = saldo − cuota − adelanto
 *
 * Los meses anteriores a `currentMonth` usan lo pagado de verdad (pagos
 * registrados), así el plan se recalcula cuando se registran pagos.
 */

export interface DebtItemInput {
  id: string;
  name: string;
  installment: number;
  /** Cuotas que quedan al empezar el plan. */
  remainingInstallments: number;
  priority: number;
}

export interface DebtPayment {
  itemId: string;
  month: string;
  amount: number;
}

export interface CmrPlanInput {
  items: DebtItemInput[];
  fixedPayment: number;
  /** Primer mes con cuota + adelanto (YYYY-MM-01). */
  startMonth: string;
  /** Meses a calcular, ordenados (YYYY-MM-01). */
  months: string[];
  payments?: DebtPayment[];
  /** Mes en curso: los anteriores se toman como reales. */
  currentMonth?: string;
}

export interface CmrItemMonth {
  installment: number;
  advance: number;
  /** Cuota + adelanto (plan), o lo pagado (mes real). */
  total: number;
  /** Pagado registrado en el mes. */
  paid: number;
}

export interface CmrPlanMonth {
  month: string;
  source: 'real' | 'plan';
  items: Record<string, CmrItemMonth>;
  total: number;
  advance: number;
  paid: number;
  remainingAfter: number;
}

export interface CmrPlanResult {
  months: CmrPlanMonth[];
  initialBalance: Record<string, number>;
  totalInitial: number;
  totalPaid: number;
  /** Saldo de cada ítem después del último mes calculado. */
  finalBalance: Record<string, number>;
  /** Mes en que la deuda queda en cero (puede estar fuera de `months`). */
  payoffMonth: string | null;
}

const EPS = 0.5; // medio peso: bajo esto se considera saldado

export function initialBalanceOf(item: Pick<DebtItemInput, 'installment' | 'remainingInstallments'>): number {
  return Math.round(item.installment * item.remainingInstallments);
}

function byPriority(items: DebtItemInput[]): DebtItemInput[] {
  return [...items].sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
}

/** Cuota y adelanto de un mes del plan, dados los saldos al inicio del mes. */
function planOneMonth(
  items: DebtItemInput[],
  balance: Record<string, number>,
  fixedPayment: number
): Record<string, { installment: number; advance: number }> {
  const out: Record<string, { installment: number; advance: number }> = {};
  let installments = 0;
  for (const it of items) {
    const inst = Math.max(0, Math.min(it.installment, balance[it.id]));
    out[it.id] = { installment: inst, advance: 0 };
    installments += inst;
  }
  let available = Math.max(0, fixedPayment - installments);
  for (const it of byPriority(items)) {
    if (available <= 0) break;
    const room = Math.max(0, balance[it.id] - out[it.id].installment);
    const adv = Math.min(room, available);
    out[it.id].advance = adv;
    available -= adv;
  }
  return out;
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function computeCmrPlan(input: CmrPlanInput): CmrPlanResult {
  const { items, fixedPayment, startMonth, months, payments = [], currentMonth } = input;

  const initialBalance: Record<string, number> = {};
  for (const it of items) initialBalance[it.id] = initialBalanceOf(it);
  const balance: Record<string, number> = { ...initialBalance };

  const paidMap = new Map<string, number>();
  for (const p of payments) {
    const key = `${p.month}|${p.itemId}`;
    paidMap.set(key, (paidMap.get(key) ?? 0) + p.amount);
  }
  const paidOf = (month: string, itemId: string) => paidMap.get(`${month}|${itemId}`) ?? 0;

  const result: CmrPlanMonth[] = [];

  for (const month of months) {
    const isPast = currentMonth !== undefined && month < currentMonth;
    const monthItems: Record<string, CmrItemMonth> = {};

    if (isPast || month < startMonth) {
      // Mes real (o previo al plan): solo cuenta lo pagado de verdad.
      for (const it of items) {
        const paid = paidOf(month, it.id);
        monthItems[it.id] = { installment: isPast ? paid : 0, advance: 0, total: isPast ? paid : 0, paid };
        balance[it.id] = Math.max(0, balance[it.id] - paid);
      }
    } else {
      const plan = planOneMonth(items, balance, fixedPayment);
      for (const it of items) {
        const { installment, advance } = plan[it.id];
        const total = installment + advance;
        const paid = paidOf(month, it.id);
        monthItems[it.id] = { installment, advance, total, paid };
        // Si se pagó más de lo planificado, manda lo pagado.
        balance[it.id] = Math.max(0, balance[it.id] - Math.max(total, paid));
      }
    }

    const vals = Object.values(monthItems);
    result.push({
      month,
      source: isPast ? 'real' : 'plan',
      items: monthItems,
      total: sum(vals.map((v) => v.total)),
      advance: sum(vals.map((v) => v.advance)),
      paid: sum(vals.map((v) => v.paid)),
      remainingAfter: sum(Object.values(balance)),
    });
  }

  const finalBalance = { ...balance };
  const totalInitial = sum(Object.values(initialBalance));

  // Fecha de término: primer mes en que el saldo queda en cero. Si no ocurre
  // dentro de `months`, se sigue simulando el plan hacia adelante.
  let payoffMonth: string | null = null;
  if (totalInitial > EPS) {
    const hit = result.find((r) => r.remainingAfter <= EPS);
    if (hit) {
      payoffMonth = hit.month;
    } else if (months.length > 0) {
      let m = addMonths(months[months.length - 1], 1);
      if (m < startMonth) m = startMonth;
      const sim = { ...balance };
      for (let i = 0; i < 120; i++, m = addMonths(m, 1)) {
        const plan = planOneMonth(items, sim, fixedPayment);
        for (const it of items) sim[it.id] = Math.max(0, sim[it.id] - plan[it.id].installment - plan[it.id].advance);
        if (sum(Object.values(sim)) <= EPS) {
          payoffMonth = m;
          break;
        }
      }
    }
  }

  return {
    months: result,
    initialBalance,
    totalInitial,
    totalPaid: sum(payments.map((p) => p.amount)),
    finalBalance,
    payoffMonth,
  };
}
