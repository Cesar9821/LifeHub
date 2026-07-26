import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';
import { todayStr } from '@/lib/format';

export interface HouseholdTask {
  id: string;
  title: string;
  notes: string | null;
  assigned_to: string | null;
  due_date: string | null;
  done: boolean;
  created_at: string;
}

export type ResetPeriod = 'none' | 'weekly' | 'monthly';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string | null;
  category: string;
  checked: boolean;
  list_id: string | null;
}

export interface ShoppingList {
  id: string;
  name: string;
  reset_period: ResetPeriod;
  last_reset_at: string;
  sort_order: number;
}

export interface ShoppingListWithItems extends ShoppingList {
  items: ShoppingItem[];
  pending: number;
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

/** Lunes (YYYY-MM-DD) de la semana que contiene la fecha dada. */
function mondayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay(); // 0=domingo … 6=sábado
  dt.setUTCDate(dt.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return dt.toISOString().slice(0, 10);
}

/** ¿Comenzó un nuevo período desde el último reinicio? */
function needsReset(list: ShoppingList, today: string): boolean {
  if (list.reset_period === 'monthly') return list.last_reset_at.slice(0, 7) < today.slice(0, 7);
  if (list.reset_period === 'weekly') return list.last_reset_at < mondayOf(today);
  return false;
}

/**
 * Listas de compras del hogar (con sus ítems), aplicando el reinicio automático.
 * Si el hogar no tiene listas, siembra "Supermercado" (mensual) y "Feria" (semanal).
 */
export async function getShoppingData(): Promise<{
  lists: ShoppingListWithItems[];
  orphans: ShoppingItem[];
  allItems: ShoppingItem[];
}> {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const today = todayStr();

  let { data: listRows } = await supabase
    .from('shopping_lists')
    .select('id, name, reset_period, last_reset_at, sort_order')
    .eq('household_id', householdId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (!listRows || listRows.length === 0) {
    await supabase.from('shopping_lists').insert([
      { household_id: householdId, name: 'Supermercado', reset_period: 'monthly', sort_order: 0 },
      { household_id: householdId, name: 'Feria', reset_period: 'weekly', sort_order: 1 },
    ]);
    ({ data: listRows } = await supabase
      .from('shopping_lists')
      .select('id, name, reset_period, last_reset_at, sort_order')
      .eq('household_id', householdId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }));
  }

  const lists = (listRows as ShoppingList[]) || [];

  // Reinicio automático: desmarca los ítems de las listas que entraron a un nuevo período.
  for (const l of lists) {
    if (needsReset(l, today)) {
      await supabase.from('shopping_items').update({ checked: false }).eq('list_id', l.id);
      await supabase.from('shopping_lists').update({ last_reset_at: today }).eq('id', l.id);
      l.last_reset_at = today;
    }
  }

  const { data: itemRows } = await supabase
    .from('shopping_items')
    .select('id, name, quantity, category, checked, list_id')
    .eq('household_id', householdId)
    .order('checked', { ascending: true })
    .order('created_at', { ascending: true });

  const items = (itemRows as ShoppingItem[]) || [];

  const byList = new Map<string, ShoppingItem[]>();
  const orphans: ShoppingItem[] = [];
  for (const it of items) {
    if (it.list_id) {
      const arr = byList.get(it.list_id) || [];
      arr.push(it);
      byList.set(it.list_id, arr);
    } else {
      orphans.push(it);
    }
  }

  const listsWithItems: ShoppingListWithItems[] = lists.map((l) => {
    const its = byList.get(l.id) || [];
    return { ...l, items: its, pending: its.filter((i) => !i.checked).length };
  });

  return { lists: listsWithItems, orphans, allItems: items };
}

export interface FamiliaSummary {
  pendingTasks: number;
  doneTasks: number;
  shoppingPending: number;
}

export function summarizeFamilia(
  tasks: HouseholdTask[],
  allItems: ShoppingItem[]
): FamiliaSummary {
  return {
    pendingTasks: tasks.filter((t) => !t.done).length,
    doneTasks: tasks.filter((t) => t.done).length,
    shoppingPending: allItems.filter((s) => !s.checked).length,
  };
}

export interface HouseholdEvent {
  id: string;
  title: string;
  notes: string | null;
  event_date: string;
  event_time: string | null;
}

/** Eventos del hogar desde hoy en adelante, ordenados por fecha/hora. */
export async function getUpcomingEvents(): Promise<HouseholdEvent[]> {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const today = todayStr();

  const { data, error } = await supabase
    .from('household_events')
    .select('id, title, notes, event_date, event_time')
    .eq('household_id', householdId)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true, nullsFirst: true });

  if (error) {
    console.error('Error cargando eventos:', error.message);
    return [];
  }
  return (data as HouseholdEvent[]) || [];
}
