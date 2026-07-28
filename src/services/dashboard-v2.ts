import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';
import {
  getMovements,
  summarize,
  periodOf,
  shiftPeriod,
  type MonthSummary,
} from './movements';

export interface DashboardData {
  period: string;
  /** Resumen del mes desde Movimientos (fuente de verdad) */
  month: MonthSummary;
  /** Planificado vs real */
  plannedIncome: number;
  plannedExpense: number;
  /** Patrimonio */
  totalSavings: number;
  totalDebt: number;
  /** Tendencia: saldo confirmado de los últimos 6 meses */
  trend: { label: string; balance: number }[];
  /** Salud financiera 0-100 */
  healthScore: number;
  /** Gasto confirmado por categoría (top del mes) */
  byCategory: { category: string; total: number }[];
  /** Ingreso confirmado por categoría (top del mes) */
  byIncomeCategory: { category: string; total: number }[];
  /** Gasto confirmado del mes anterior */
  prevExpense: number;
  /** Presupuesto global: límite total y gastado en categorías con presupuesto */
  budgetTotal: number;
  budgetSpent: number;
  /** Ingresos y gastos confirmados del mes por persona del hogar */
  byPerson: { user_id: string; income: number; expense: number }[];
}

const SHORT_MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export async function getDashboardData(
  period = periodOf()
): Promise<DashboardData> {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const [movements, recurringRes, savingsRes, creditsRes, budgetsRes] = await Promise.all([
    getMovements(period),
    supabase
      .from('recurring_items')
      .select('kind, amount, is_active')
      .eq('household_id', householdId)
      .eq('is_active', true),
    supabase
      .from('savings')
      .select('current_amount')
      .eq('household_id', householdId),
    supabase
      .from('credits')
      .select('remaining_amount')
      .eq('household_id', householdId),
    supabase
      .from('budgets')
      .select('category, amount')
      .eq('household_id', householdId),
  ]);

  const month = summarize(movements);

  // Gasto confirmado por categoría (top del mes)
  const catMap = new Map<string, number>();
  for (const m of movements) {
    if (m.kind === 'expense' && m.status === 'confirmed') {
      catMap.set(m.category, (catMap.get(m.category) || 0) + m.effective_amount);
    }
  }
  const byCategory = [...catMap.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  // Ingreso confirmado por categoría (de dónde viene la plata)
  const incCatMap = new Map<string, number>();
  for (const m of movements) {
    if (m.kind === 'income' && m.status === 'confirmed') {
      incCatMap.set(m.category, (incCatMap.get(m.category) || 0) + m.effective_amount);
    }
  }
  const byIncomeCategory = [...incCatMap.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  // Ingresos y gastos confirmados por persona del hogar (created_by)
  const personMap = new Map<string, { income: number; expense: number }>();
  for (const m of movements) {
    if (m.status !== 'confirmed') continue;
    const key = m.created_by || '';
    const p = personMap.get(key) || { income: 0, expense: 0 };
    if (m.kind === 'income') p.income += m.effective_amount;
    else p.expense += m.effective_amount;
    personMap.set(key, p);
  }
  const byPerson = [...personMap.entries()].map(([user_id, v]) => ({ user_id, income: v.income, expense: v.expense }));

  // Presupuesto global del mes (suma de límites vs gastado en esas categorías)
  const budgetsData = (budgetsRes.data as { category: string; amount: number }[]) || [];
  const budgetTotal = budgetsData.reduce((a, b) => a + Number(b.amount), 0);
  const budgetSpent = budgetsData.reduce((a, b) => a + (catMap.get(b.category) || 0), 0);

  const recurring = recurringRes.data || [];
  const plannedIncome = recurring
    .filter((r) => r.kind === 'income')
    .reduce((a, r) => a + Number(r.amount), 0);
  const plannedExpense = recurring
    .filter((r) => r.kind === 'expense')
    .reduce((a, r) => a + Number(r.amount), 0);

  const totalSavings = (savingsRes.data || []).reduce(
    (a, s) => a + Number(s.current_amount || 0),
    0
  );
  const totalDebt = (creditsRes.data || []).reduce(
    (a, c) => a + Number(c.remaining_amount || 0),
    0
  );

  // Tendencia de los últimos 6 meses (incluyendo el actual)
  const periods = Array.from({ length: 6 }, (_, i) =>
    shiftPeriod(period, -(5 - i))
  );
  const trendMovements = await Promise.all(periods.map((p) => getMovements(p)));
  const trend = periods.map((p, i) => {
    const s = summarize(trendMovements[i]);
    const m = Number(p.split('-')[1]);
    return { label: SHORT_MONTHS[m - 1], balance: s.balance };
  });

  // Gasto confirmado del mes anterior (para comparar)
  const prevMovs = trendMovements[trendMovements.length - 2] || [];
  const prevExpense = prevMovs
    .filter((m) => m.kind === 'expense' && m.status === 'confirmed')
    .reduce((a, m) => a + m.effective_amount, 0);

  // Salud: qué proporción de tus ingresos confirmados te queda
  const healthScore =
    month.incomeConfirmed > 0
      ? Math.max(
          0,
          Math.min(100, Math.round((month.balance / month.incomeConfirmed) * 100))
        )
      : 0;

  return {
    period,
    month,
    plannedIncome,
    plannedExpense,
    totalSavings,
    totalDebt,
    trend,
    healthScore,
    byCategory,
    byIncomeCategory,
    prevExpense,
    budgetTotal,
    budgetSpent,
    byPerson,
  };
}
