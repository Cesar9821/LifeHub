import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';

/**
 * Nombres de los conceptos del presupuesto separados por tipo, para los
 * selects de categoría (Movimientos, Planificación). Los conceptos del plan
 * del hogar son la única fuente de categorías; al guardar, la base de datos
 * vincula el movimiento a su concepto por nombre.
 */
export async function getCategoryNamesByKind(): Promise<{
  income: string[];
  expense: string[];
}> {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const { data, error } = await supabase
    .from('budget_concepts')
    .select('name, kind, is_debt_plan')
    .eq('household_id', householdId)
    .eq('archived', false)
    .order('sort')
    .order('name');

  if (error) {
    console.error('Error cargando conceptos:', error.message);
    return { income: [], expense: [] };
  }
  const rows = (data as { name: string; kind: string; is_debt_plan: boolean }[]) || [];
  return {
    income: rows.filter((c) => c.kind === 'income').map((c) => c.name),
    // Las cuotas del plan CMR se registran con su ítem desde "+ Gasto".
    expense: rows.filter((c) => c.kind === 'expense' && !c.is_debt_plan).map((c) => c.name),
  };
}
