export type TransactionType = 'income' | 'expense' | 'transfer';
export type DestinationType = 'normal' | 'saving' | 'credit';

export interface DashboardMetrics {
  income_month: number;
  expenses_month: number;
  total_savings: number;
  total_debt: number;
  net_balance: number;
  health_score: number;
}