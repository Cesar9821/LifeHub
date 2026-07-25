import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';

export interface HouseholdTask {
  id: string;
  title: string;
  notes: string | null;
  assigned_to: string | null;
  due_date: string | null;
  done: boolean;
  created_at: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string | null;
  category: string;
  checked: boolean;
}

/** Tareas del hogar activo, pendientes primero y por fecha. */
export async function getTasks(): Promise<HouseholdTask[]> {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const { data, error } = await supabase
    .from('household_tasks')
    .select('id, title, notes, assigned_to, due_date, done, created_at')
    .eq('household_id', householdId)
    .order('done', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando tareas:', error.message);
    return [];
  }
  return (data as HouseholdTask[]) || [];
}

/** Lista de compras del hogar activo (no marcados primero). */
export async function getShoppingItems(): Promise<ShoppingItem[]> {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const { data, error } = await supabase
    .from('shopping_items')
    .select('id, name, quantity, category, checked')
    .eq('household_id', householdId)
    .order('checked', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error cargando compras:', error.message);
    return [];
  }
  return (data as ShoppingItem[]) || [];
}

export interface FamiliaSummary {
  pendingTasks: number;
  doneTasks: number;
  shoppingPending: number;
}

export function summarizeFamilia(
  tasks: HouseholdTask[],
  shopping: ShoppingItem[]
): FamiliaSummary {
  return {
    pendingTasks: tasks.filter((t) => !t.done).length,
    doneTasks: tasks.filter((t) => t.done).length,
    shoppingPending: shopping.filter((s) => !s.checked).length,
  };
}
