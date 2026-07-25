'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser, getActiveHouseholdId } from '@/lib/auth';
import { failIf } from '@/lib/errors';
import { revalidatePath } from 'next/cache';

function revalidate() {
  revalidatePath('/familia');
}

/** Crea una tarea del hogar (opcionalmente asignada y con fecha). */
export async function addTask(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();

  const title = String(formData.get('title') || '').trim();
  const assignedTo = String(formData.get('assigned_to') || '') || null;
  const dueDate = String(formData.get('due_date') || '') || null;
  if (!title) return;

  const { error } = await supabase.from('household_tasks').insert([
    {
      household_id: householdId,
      created_by: user.id,
      title,
      assigned_to: assignedTo,
      due_date: dueDate,
    },
  ]);

  failIf(error, 'No se pudo crear la tarea');
  revalidate();
}

/** Marca/desmarca una tarea como hecha. */
export async function toggleTask(formData: FormData) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const id = String(formData.get('id') || '');
  const done = formData.get('done') === 'true';
  if (!id) return;

  const { error } = await supabase
    .from('household_tasks')
    .update({ done: !done, done_at: !done ? new Date().toISOString() : null })
    .eq('id', id)
    .eq('household_id', householdId);

  failIf(error, 'No se pudo actualizar la tarea');
  revalidate();
}

/** Elimina una tarea. */
export async function deleteTask(formData: FormData) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const id = String(formData.get('id') || '');
  if (!id) return;

  const { error } = await supabase
    .from('household_tasks')
    .delete()
    .eq('id', id)
    .eq('household_id', householdId);

  failIf(error, 'No se pudo eliminar la tarea');
  revalidate();
}

/** Agrega un ítem a la lista de compras. */
export async function addShoppingItem(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();

  const name = String(formData.get('name') || '').trim();
  const quantity = String(formData.get('quantity') || '').trim() || null;
  if (!name) return;

  const { error } = await supabase.from('shopping_items').insert([
    { household_id: householdId, created_by: user.id, name, quantity },
  ]);

  failIf(error, 'No se pudo agregar el producto');
  revalidate();
}

/** Marca/desmarca un ítem de compras. */
export async function toggleShoppingItem(formData: FormData) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const id = String(formData.get('id') || '');
  const checked = formData.get('checked') === 'true';
  if (!id) return;

  const { error } = await supabase
    .from('shopping_items')
    .update({ checked: !checked })
    .eq('id', id)
    .eq('household_id', householdId);

  failIf(error, 'No se pudo actualizar el producto');
  revalidate();
}

/** Elimina un ítem de compras. */
export async function deleteShoppingItem(formData: FormData) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const id = String(formData.get('id') || '');
  if (!id) return;

  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('id', id)
    .eq('household_id', householdId);

  failIf(error, 'No se pudo eliminar el producto');
  revalidate();
}

/** Vacía los productos ya marcados (comprados). */
export async function clearCheckedShopping() {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('household_id', householdId)
    .eq('checked', true);

  failIf(error, 'No se pudo limpiar la lista');
  revalidate();
}
