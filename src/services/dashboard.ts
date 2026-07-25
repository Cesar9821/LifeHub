import { createClient } from '@/lib/supabase/server';

export async function getDashboardData() {
  const supabase = await createClient();

  // Traemos los datos. Usamos .select() simple.
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*');

  if (error) {
    // Esto nos dirá en la terminal de VSCode exactamente qué pasa
    console.log("DETALLE DEL ERROR:", error.message, error.details, error.hint);
    return { net_balance: 0, income_month: 0, expenses_month: 0, total_debt: 0, health_score: 0 };
  }

  const income = transactions?.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const expenses = transactions?.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0) || 0;

  return {
    net_balance: income - expenses,
    income_month: income,
    expenses_month: expenses,
    total_debt: 0,
    health_score: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0
  };
}