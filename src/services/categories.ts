import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';

export interface Category {
  id: string;
  name: string;
  kind: 'income' | 'expense';
  color: string;
  icon: string;
}

/**
 * Devuelve todas las categorías del hogar, ordenadas.
 * Es la única fuente de verdad para las categorías (no más listas hardcodeadas).
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, kind, color, icon')
    .eq('household_id', householdId)
    .order('kind', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error cargando categorías:', error.message);
    return [];
  }
  return (data as Category[]) || [];
}

/**
 * Solo los nombres de categorías de gasto (para selects de gasto).
 */
export async function getExpenseCategoryNames(): Promise<string[]> {
  const cats = await getCategories();
  return cats.filter((c) => c.kind === 'expense').map((c) => c.name);
}

/**
 * Nombres separados por tipo, útil para formularios que cambian según ingreso/gasto.
 */
export async function getCategoryNamesByKind(): Promise<{
  income: string[];
  expense: string[];
}> {
  const cats = await getCategories();
  return {
    income: cats.filter((c) => c.kind === 'income').map((c) => c.name),
    expense: cats.filter((c) => c.kind === 'expense').map((c) => c.name),
  };
}
