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

  const [movements, recurringRes, savingsRes, creditsRes] = await Promise.all([
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
  ]);

  const month = summarize(movements);

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
  };
}
