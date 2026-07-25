import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';

export interface Budget {
  id: string;
  category: string;
  amount: number;
}

export interface BudgetProgress {
  id: string;
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percent: number; // 0-100+ (puede pasar de 100 si se excede)
  status: 'ok' | 'warning' | 'over'; // ok <80%, warning 80-100%, over >100%
}

/** Rango [inicio, fin) del mes actual en ISO. */
function currentMonthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { first: first.toISOString(), next: nextMonth.toISOString() };
}

/** Lista simple de presupuestos definidos. */
export async function getBudgets(): Promise<Budget[]> {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const { data, error } = await supabase
    .from('budgets')
    .select('id, category, amount')
    .eq('household_id', householdId)
    .order('category', { ascending: true });

  if (error) {
    console.error('Error cargando presupuestos:', error.message);
    return [];
  }
  return (data as Budget[]) || [];
}

/**
 * Presupuestos con el gasto real del mes calculado por categoría.
 * El "gasto" son transacciones de tipo 'expense' del mes en curso.
 */
export async function getBudgetProgress(): Promise<BudgetProgress[]> {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const { first, next } = currentMonthRange();

  const [budgetsRes, txRes] = await Promise.all([
    supabase
      .from('budgets')
      .select('id, category, amount')
      .eq('household_id', householdId),
    supabase
      .from('transactions')
      .select('amount, category, type')
      .eq('household_id', householdId)
      .eq('type', 'expense')
      .gte('created_at', first)
      .lt('created_at', next),
  ]);

  const budgets = (budgetsRes.data as Budget[]) || [];
  const txs = (txRes.data as { amount: number; category: string }[]) || [];

  // Suma de gasto por categoría (los gastos se guardan en negativo -> abs)
  const spentByCategory = new Map<string, number>();
  for (const tx of txs) {
    const cat = tx.category || 'General';
    const prev = spentByCategory.get(cat) || 0;
    spentByCategory.set(cat, prev + Math.abs(tx.amount));
  }

  return budgets
    .map((b) => {
      const spent = spentByCategory.get(b.category) || 0;
      const limit = b.amount;
      const remaining = limit - spent;
      const percent = limit > 0 ? (spent / limit) * 100 : 0;
      const status: BudgetProgress['status'] =
        percent > 100 ? 'over' : percent >= 80 ? 'warning' : 'ok';
      return { id: b.id, category: b.category, limit, spent, remaining, percent, status };
    })
    .sort((a, b) => b.percent - a.percent); // los más urgentes primero
}
