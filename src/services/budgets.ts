import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';
import { getMovements, periodOf } from '@/services/movements';

export interface BudgetRow {
  category: string;
  amount: number;
  spent: number;
  /** 0-100+, puede pasar de 100 si te excediste. */
  percent: number;
}

/** Presupuestos por categoría con lo gastado (confirmado) del mes en curso. */
export async function getBudgets(): Promise<BudgetRow[]> {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const [{ data: budgetRows }, movements] = await Promise.all([
    supabase.from('budgets').select('category, amount').eq('household_id', householdId),
    getMovements(periodOf()),
  ]);

  const spentByCat = new Map<string, number>();
  for (const m of movements) {
    if (m.kind === 'expense' && m.status === 'confirmed') {
      spentByCat.set(m.category, (spentByCat.get(m.category) || 0) + m.effective_amount);
    }
  }

  const budgets = (budgetRows as { category: string; amount: number }[]) || [];
  return budgets
    .map((b) => {
      const amount = Number(b.amount) || 0;
      const spent = spentByCat.get(b.category) || 0;
      return {
        category: b.category,
        amount,
        spent,
        percent: amount > 0 ? Math.round((spent / amount) * 100) : 0,
      };
    })
    .sort((a, b) => b.percent - a.percent);
}

export interface BudgetsSummary {
  totalBudget: number;
  totalSpent: number;
  overCount: number;
}

export function summarizeBudgets(rows: BudgetRow[]): BudgetsSummary {
  return {
    totalBudget: rows.reduce((a, r) => a + r.amount, 0),
    totalSpent: rows.reduce((a, r) => a + r.spent, 0),
    overCount: rows.filter((r) => r.spent > r.amount && r.amount > 0).length,
  };
}
