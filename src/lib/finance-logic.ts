import { addMonths, format } from 'date-fns';

export interface ProjectionPoint {
  month: string;
  balance: number;
}

/**
 * Genera una proyección basada en el balance actual y el flujo neto promedio
 */
export function calculateProjection(
  currentBalance: number,
  monthlyIncome: number,
  monthlyExpenses: number,
  months: number = 6
): ProjectionPoint[] {
  const netFlow = monthlyIncome - monthlyExpenses;
  const projection: ProjectionPoint[] = [];

  for (let i = 0; i <= months; i++) {
    const date = addMonths(new Date(), i);
    projection.push({
      month: format(date, 'MMM yy'),
      // Balance_Proyectado = Balance_Actual + (Flujo_Neto * n_meses)
      balance: currentBalance + (netFlow * i),
    });
  }

  return projection;
}