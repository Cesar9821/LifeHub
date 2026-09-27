import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';

export type MovementStatus = 'pending' | 'confirmed';
export type DateState = 'overdue' | 'today' | 'upcoming';

export interface Movement {
  id: string;
  recurring_id: string | null;
  created_by: string | null;
  description: string;
  kind: 'income' | 'expense';
  category: string;
  estimated_amount: number;
  actual_amount: number | null;
  status: MovementStatus;
  due_date: string;
  confirmed_at: string | null;
  period_month: string;
  // Derivados (calculados en el servicio)
  effective_amount: number; // actual si existe, si no el estimado
  date_state: DateState;
}

export interface MonthSummary {
  incomeConfirmed: number;
  expenseConfirmed: number;
  balance: number; // saldo líquido real (solo confirmado)
  pendingIncome: number;
  pendingExpense: number;
  projectedBalance: number; // si se confirma todo lo pendiente
  pendingCount: number;
  overdueCount: number;
}

/** Primer día del mes dado (o el actual) en formato YYYY-MM-DD. */
export function periodOf(date = new Date()): string {
  return new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

/** Desplaza un periodo N meses (positivo o negativo). */
export function shiftPeriod(period: string, months: number): string {
  const [y, m] = period.split('-').map(Number);
  return periodOf(new Date(y, m - 1 + months, 1));
}

/** Valida y normaliza un periodo recibido por URL. Si es inválido, usa el actual. */
export function normalizePeriod(raw?: string): string {
  if (!raw) return periodOf();
  const match = /^(\d{4})-(\d{2})$/.exec(raw) || /^(\d{4})-(\d{2})-\d{2}$/.exec(raw);
  if (!match) return periodOf();
  const y = Number(match[1]);
  const m = Number(match[2]);
  if (y < 2000 || y > 2100 || m < 1 || m > 12) return periodOf();
  return periodOf(new Date(y, m - 1, 1));
}

/** Etiqueta legible: "Agosto 2026". */
export function periodLabel(period: string): string {
  const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const [y, m] = period.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** ¿Es el mes en curso? */
export function isCurrentPeriod(period: string): boolean {
  return period === periodOf();
}

/** Estado de una fecha respecto a hoy. */
function dateStateOf(dueDate: string): DateState {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  if (due.getTime() < today.getTime()) return 'overdue';
  if (due.getTime() === today.getTime()) return 'today';
  return 'upcoming';
}

/** Movimientos de un mes, con derivados calculados. */
export async function getMovements(period = periodOf()): Promise<Movement[]> {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const { data, error } = await supabase
    .from('movements')
    .select('*')
    .eq('household_id', householdId)
    .eq('period_month', period)
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Error cargando movimientos:', error.message);
    return [];
  }

  return (data || []).map((m: Record<string, unknown>) => {
    const actual = m.actual_amount as number | null;
    const estimated = m.estimated_amount as number;
    return {
      ...(m as unknown as Movement),
      effective_amount: actual ?? estimated,
      date_state: dateStateOf(m.due_date as string),
    };
  });
}

/** Resumen del mes: saldo real, pendientes, proyección. */
export function summarize(movements: Movement[]): MonthSummary {
  let incomeConfirmed = 0;
  let expenseConfirmed = 0;
  let pendingIncome = 0;
  let pendingExpense = 0;
  let pendingCount = 0;
  let overdueCount = 0;

  for (const m of movements) {
    if (m.status === 'confirmed') {
      if (m.kind === 'income') incomeConfirmed += m.effective_amount;
      else expenseConfirmed += m.effective_amount;
    } else {
      pendingCount++;
      if (m.date_state === 'overdue') overdueCount++;
      if (m.kind === 'income') pendingIncome += m.effective_amount;
      else pendingExpense += m.effective_amount;
    }
  }

  const balance = incomeConfirmed - expenseConfirmed;
  const projectedBalance = balance + pendingIncome - pendingExpense;

  return {
    incomeConfirmed,
    expenseConfirmed,
    balance,
    pendingIncome,
    pendingExpense,
    projectedBalance,
    pendingCount,
    overdueCount,
  };
}
