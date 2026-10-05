'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser, getActiveHouseholdId } from '@/lib/auth';
import { failIf } from '@/lib/errors';
import { notifyUser } from '@/lib/notify';
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
  repeat: z.enum(['none', 'weekly', 'monthly']).default('none'),
});

/** Avanza una fecha YYYY-MM-DD según el período. */
function advanceDate(dateStr: string, repeat: 'weekly' | 'monthly'): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = repeat === 'weekly' ? Date.UTC(y, m - 1, d + 7) : Date.UTC(y, m, d);
  return new Date(next).toISOString().slice(0, 10);
}

/** Crea una tarea del hogar (opcionalmente asignada y con fecha). */
export async function addTask(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(taskSchema, formData);
  if (!parsed.success) return parsed.state;
  const { title, assigned_to, due_date, repeat } = parsed.data;

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
      repeat,
    },
  ]);

  if (error) {
    console.error('Error creando tarea:', error.message);
    return errorState('No se pudo crear la tarea. Inténtalo de nuevo.');
  }

  // Aviso instantáneo a quien se le asignó (si no es uno mismo).
  if (assigned_to && assigned_to !== user.id) {
    await notifyUser(
      assigned_to,
      { title: '🏠 Nueva tarea para ti', body: title, url: '/familia', tag: 'task-assign' },
      'familia'
    );
  }

  revalidate();
  return successState('Tarea agregada.');
}

const updateTaskSchema = z.object({
  id: z.string().min(1),
  title: zRequiredText('La tarea'),
  assigned_to: z
    .string()
    .transform((v) => (v.trim() === '' ? null : v.trim()))
    .nullable(),
  due_date: zOptionalDate,
});

/** Edita una tarea del hogar. Contrato FormState. */
export async function updateTask(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(updateTaskSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, title, assigned_to, due_date } = parsed.data;

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const { error } = await supabase
    .from('household_tasks')
    .update({ title, assigned_to, due_date })
    .eq('id', id)
    .eq('household_id', householdId);

  if (error) {
    console.error('Error editando tarea:', error.message);
    return errorState('No se pudo guardar la tarea.');
  }

  revalidate();
  return successState('Tarea actualizada.');
}

/** Marca/desmarca una tarea. Al completar una recurrente, genera la siguiente. */
export async function toggleTask(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();

  const id = String(formData.get('id') || '');
  const done = formData.get('done') === 'true';
  if (!id) return;
  const nowDone = !done;

  const { error } = await supabase
    .from('household_tasks')
    .update({ done: nowDone, done_at: nowDone ? new Date().toISOString() : null })
    .eq('id', id)
    .eq('household_id', householdId);
  failIf(error, 'No se pudo actualizar la tarea');

  if (nowDone) {
    const { data: task } = await supabase
      .from('household_tasks')
      .select('title, assigned_to, due_date, repeat')
      .eq('id', id)
      .maybeSingle();
    if (task && task.repeat && task.repeat !== 'none' && task.due_date) {
      await supabase.from('household_tasks').insert([
        {
          household_id: householdId,
          created_by: user.id,
          title: task.title,
          assigned_to: task.assigned_to,
          due_date: advanceDate(task.due_date, task.repeat as 'weekly' | 'monthly'),
          repeat: task.repeat,
        },
      ]);
    }
  }

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
  list_id: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== '' ? v.trim() : null)),
});

/** Agrega un ítem a una lista de compras. */
export async function addShoppingItem(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parseForm(shoppingSchema, formData);
  if (!parsed.success) return parsed.state;
  const { name, quantity, list_id } = parsed.data;

  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();

  const { error } = await supabase.from('shopping_items').insert([
    { household_id: householdId, created_by: user.id, name, quantity, list_id },
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

const listSchema = z.object({
  name: zRequiredText('El nombre'),
  reset_period: z.enum(['none', 'weekly', 'monthly']).default('none'),
});

/** Crea una lista de compras (con su período de reinicio). */
export async function addShoppingList(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(listSchema, formData);
  if (!parsed.success) return parsed.state;
  const { name, reset_period } = parsed.data;

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const { error } = await supabase.from('shopping_lists').insert([
    { household_id: householdId, name, reset_period },
  ]);

  if (error) {
    console.error('Error creando lista:', error.message);
    return errorState('No se pudo crear la lista.');
  }

  revalidate();
  return successState('Lista creada.');
}

/** Elimina una lista (y sus productos por cascada). */
export async function deleteShoppingList(formData: FormData) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const id = String(formData.get('id') || '');
  if (!id) return;

  const { error } = await supabase
    .from('shopping_lists')
    .delete()
    .eq('id', id)
    .eq('household_id', householdId);

  failIf(error, 'No se pudo eliminar la lista');
  revalidate();
}

/** Reinicia una lista ahora: desmarca todos sus productos. */
export async function resetListNow(formData: FormData) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const id = String(formData.get('id') || '');
  if (!id) return;

  const { error } = await supabase
    .from('shopping_items')
    .update({ checked: false })
    .eq('list_id', id)
    .eq('household_id', householdId);

  failIf(error, 'No se pudo reiniciar la lista');
  revalidate();
}

const eventSchema = z.object({
  title: zRequiredText('El evento'),
  event_date: z.string().refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), 'Elige una fecha válida.'),
  event_time: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== '' ? v.trim() : null)),
  notes: zOptionalText,
});

/** Crea un evento del calendario del hogar. */
export async function addEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(eventSchema, formData);
  if (!parsed.success) return parsed.state;
  const { title, event_date, event_time, notes } = parsed.data;

  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();

  const { error } = await supabase.from('household_events').insert([
    { household_id: householdId, created_by: user.id, title, event_date, event_time, notes },
  ]);

  if (error) {
    console.error('Error creando evento:', error.message);
    return errorState('No se pudo crear el evento.');
  }

  revalidate();
  return successState('Evento agregado.');
}

/** Elimina un evento. */
export async function deleteEvent(formData: FormData) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const id = String(formData.get('id') || '');
  if (!id) return;

  const { error } = await supabase
    .from('household_events')
    .delete()
    .eq('id', id)
    .eq('household_id', householdId);

  failIf(error, 'No se pudo eliminar el evento');
  revalidate();
}

/** Guarda el menú semanal completo (reemplaza el existente). */
export async function setMealPlan(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const rows: { household_id: string; weekday: number; slot: string; title: string }[] = [];
  for (let d = 0; d < 7; d++) {
    for (const slot of ['almuerzo', 'cena'] as const) {
      const title = String(formData.get(`m_${d}_${slot}`) || '').trim();
      if (title) rows.push({ household_id: householdId, weekday: d, slot, title });
    }
  }

  await supabase.from('meal_plan').delete().eq('household_id', householdId);
  if (rows.length > 0) {
    const { error } = await supabase.from('meal_plan').insert(rows);
    if (error) {
      console.error('Error guardando menú:', error.message);
      return errorState('No se pudo guardar el menú.');
    }
  }

  revalidate();
  return successState('Menú guardado.');
}
