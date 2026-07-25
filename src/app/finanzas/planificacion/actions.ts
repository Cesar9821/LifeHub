'use server';

import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';
import { failIf } from '@/lib/errors';
import { revalidatePath } from 'next/cache';

export async function addRecurring(formData: FormData) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const description = String(formData.get('description') || '').trim();
  const kind = String(formData.get('kind') || 'expense');
  const amount = Number(formData.get('amount')) || 0;
  const due_day = Number(formData.get('due_day')) || 1;
  const category = String(formData.get('category') || 'General');
  const is_variable = formData.get('is_variable') === 'on';

  if (!description || (kind !== 'income' && kind !== 'expense')) return;
  if (due_day < 1 || due_day > 31) return;

  const { error } = await supabase.from('recurring_items').insert([
    {
      household_id: householdId,
      description,
      kind,
      amount,
      is_variable,
      due_day,
      category,
      is_active: true,
    },
  ]);

  failIf(error, 'No se pudo crear el recurrente');

  revalidatePath('/finanzas/planificacion');
  revalidatePath('/finanzas/movimientos');
}

export async function deleteRecurring(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get('id') || '');
  if (!id) return;

  const { error } = await supabase.from('recurring_items').delete().eq('id', id);
  failIf(error, 'No se pudo eliminar el recurrente');

  revalidatePath('/finanzas/planificacion');
  revalidatePath('/finanzas/movimientos');
}

export async function toggleRecurring(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get('id') || '');
  const isActive = formData.get('is_active') === 'true';
  if (!id) return;

  const { error } = await supabase
    .from('recurring_items')
    .update({ is_active: !isActive })
    .eq('id', id);
  failIf(error, 'No se pudo cambiar el estado del recurrente');

  revalidatePath('/finanzas/planificacion');
  revalidatePath('/finanzas/movimientos');
}
