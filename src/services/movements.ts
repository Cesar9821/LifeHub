import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';

export interface RecurringItem {
  id: string;
  description: string;
  kind: 'income' | 'expense';
  amount: number;
  is_variable: boolean;
  due_day: number;
  category: string;
  is_active: boolean;
}

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

/** Construye una fecha YYYY-MM-DD para un día dentro de un mes, sin desbordar. */
function dateForDay(period: string, day: number): string {
  const [y, m] = period.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate(); // último día del mes m
  const safeDay = Math.min(day, lastDay);
  return `${y}-${String(m).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

/** Todas las plantillas recurrentes del hogar. */
export async function getRecurringItems(): Promise<RecurringItem[]> {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const { data, error } = await supabase
    .from('recurring_items')
    .select('*')
    .eq('household_id', householdId)
    .order('due_day', { ascending: true });
  if (error) {
    console.error('Error cargando recurrentes:', error.message);
    return [];
  }
  return (data as RecurringItem[]) || [];
}

/**
 * Genera los movimientos pendientes del mes a partir de las plantillas activas,
 * si aún no existen. Idempotente gracias al índice único (recurring_id, period).
 */
export async function ensureMonthGenerated(period = periodOf()): Promise<void> {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const [{ data: recurring }, { data: existing }] = await Promise.all([
    supabase
      .from('recurring_items')
      .select('*')
      .eq('household_id', householdId)
      .eq('is_active', true),
    supabase
      .from('movements')
      .select('recurring_id')
      .eq('household_id', householdId)
      .eq('period_month', period)
      .not('recurring_id', 'is', null),
  ]);

  if (!recurring || recurring.length === 0) return;

  const alreadyGenerated = new Set((existing || []).map((m) => m.recurring_id));
  const toInsert = recurring
    .filter((r) => !alreadyGenerated.has(r.id))
    .map((r) => ({
      household_id: householdId,
      recurring_id: r.id,
      description: r.description,
      kind: r.kind,
      category: r.category,
      estimated_amount: r.amount,
      actual_amount: null,
      status: 'pending',
      due_date: dateForDay(period, r.due_day),
      period_month: period,
    }));

  if (toInsert.length > 0) {
    const { error } = await supabase.from('movements').insert(toInsert);
    if (error) console.error('Error generando movimientos del mes:', error.message);
  }
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
