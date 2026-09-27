/**
 * Cuentas del mes: lo que se paga (o recibe) una vez al mes, con su estado.
 * Una cuenta queda pagada cuando existe al menos un movimiento confirmado de
 * ese concepto en el mes (o de ese ítem, en las cuotas del plan CMR).
 */

export interface ChecklistConcept {
  id: string;
  name: string;
  kind: 'income' | 'expense';
  group: string;
  payMode: 'cuenta' | 'bolsa';
  dueDay: number | null;
  isDebtPlan: boolean;
  archived: boolean;
}

export interface ChecklistPayment {
  id: string;
  conceptId: string | null;
  debtItemId: string | null;
  amount: number;
  date: string;
  paidBy: string | null;
  method: string | null;
}

export interface DebtLine {
  itemId: string;
  name: string;
  /** Cuota + adelanto planificado del mes. */
  amount: number;
}

export type ChecklistState = 'pagado' | 'vencido' | 'vence_hoy' | 'por_pagar';

export interface ChecklistItem {
  key: string;
  kind: 'income' | 'expense';
  conceptId: string;
  debtItemId: string | null;
  label: string;
  group: string;
  /** Monto presupuestado (o del plan CMR). */
  amount: number;
  dueDate: string | null;
  state: ChecklistState;
  paid: number;
  payments: ChecklistPayment[];
  /** Fecha sugerida para registrar el pago. */
  payDate: string;
}

export interface ChecklistInput {
  month: string; // YYYY-MM-01
  today: string; // YYYY-MM-DD
  concepts: ChecklistConcept[];
  budgetOf: (conceptId: string) => number;
  debtLines: DebtLine[];
  payments: ChecklistPayment[];
}

function dueDateIn(month: string, day: number | null): string | null {
  if (!day) return null;
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${month.slice(0, 8)}${String(Math.min(day, last)).padStart(2, '0')}`;
}

function lastDayOf(month: string): string {
  return dueDateIn(month, 31)!;
}

const STATE_ORDER: Record<ChecklistState, number> = { vencido: 0, vence_hoy: 1, por_pagar: 2, pagado: 3 };

export function buildChecklist(input: ChecklistInput): ChecklistItem[] {
  const { month, today, concepts, budgetOf, debtLines, payments } = input;
  const inMonth = today.slice(0, 7) === month.slice(0, 7);

  const stateOf = (paid: boolean, dueDate: string | null): ChecklistState => {
    if (paid) return 'pagado';
    if (today > lastDayOf(month)) return 'vencido'; // el mes ya pasó
    if (!dueDate) return 'por_pagar';
    if (dueDate < today) return 'vencido';
    if (dueDate === today) return 'vence_hoy';
    return 'por_pagar';
  };
  const payDateFor = (dueDate: string | null) => (inMonth ? today : dueDate ?? month);

  const items: ChecklistItem[] = [];

  for (const c of concepts) {
    if (c.payMode !== 'cuenta') continue;
    const dueDate = dueDateIn(month, c.dueDay);

    if (c.isDebtPlan) {
      // Una línea por ítem de la deuda con pago planificado (o ya pagado) este mes.
      for (const line of debtLines) {
        const ps = payments.filter((p) => p.debtItemId === line.itemId);
        if (line.amount < 1 && ps.length === 0) continue;
        items.push({
          key: `${c.id}:${line.itemId}`,
          kind: c.kind,
          conceptId: c.id,
          debtItemId: line.itemId,
          label: line.name,
          group: 'Cuotas CMR',
          amount: Math.round(line.amount),
          dueDate,
          state: stateOf(ps.length > 0, dueDate),
          paid: ps.reduce((a, p) => a + p.amount, 0),
          payments: ps,
          payDate: payDateFor(dueDate),
        });
      }
      continue;
    }

    const ps = payments.filter((p) => p.conceptId === c.id);
    const budget = budgetOf(c.id);
    if (c.archived && ps.length === 0) continue;
    if (budget <= 0 && ps.length === 0) continue; // no corresponde este mes
    items.push({
      key: c.id,
      kind: c.kind,
      conceptId: c.id,
      debtItemId: null,
      label: c.name,
      group: c.group,
      amount: budget,
      dueDate,
      state: stateOf(ps.length > 0, dueDate),
      paid: ps.reduce((a, p) => a + p.amount, 0),
      payments: ps,
      payDate: payDateFor(dueDate),
    });
  }

  return items.sort(
    (a, b) =>
      STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
      (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') ||
      0
  );
}
