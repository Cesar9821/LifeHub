'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser, getActiveHouseholdId } from '@/lib/auth';
import { failIf } from '@/lib/errors';
import {
  parseForm,
  errorState,
  successState,
  zRequiredText,
  zOptionalText,
  zOptionalDate,
  type FormState,
} from '@/lib/action';
import { revalidatePath } from 'next/cache';

function revalidate() {
  revalidatePath('/familia');
}

const taskSchema = z.object({
  title: zRequiredText('La tarea'),
  assigned_to: z
    .string()
    .transform((v) => (v.trim() === '' ? null : v.trim()))
    .nullable(),
  due_date: zOptionalDate,
});

/** Crea una tarea del hogar (opcionalmente asignada y con fecha). */
export async function addTask(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(taskSchema, formData);
  if (!parsed.success) return parsed.state;
  const { title, assigned_to, due_date } = parsed.data;

  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();

  const { error } = await supabase.from('household_tasks').insert([
    {
      household_id: householdId,
      created_by: user.id,
      title,
      assigned_to,
      due_date,
    },
  ]);

  if (error) {
    console.error('Error creando tarea:', error.message);
    return errorState('No se pudo crear la tarea. Inténtalo de nuevo.');
  }

  revalidate();
  return successState('Tarea agregada.');
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

const shoppingSchema = z.object({
  name: zRequiredText('El producto'),
  quantity: zOptionalText,
});

/** Agrega un ítem a la lista de compras. */
export async function addShoppingItem(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parseForm(shoppingSchema, formData);
  if (!parsed.success) return parsed.state;
  const { name, quantity } = parsed.data;

  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();

  const { error } = await supabase.from('shopping_items').insert([
    { household_id: householdId, created_by: user.id, name, quantity },
  ]);

  if (error) {
    console.error('Error agregando producto:', error.message);
    return errorState('No se pudo agregar el producto.');
  }

  revalidate();
  return successState();
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
