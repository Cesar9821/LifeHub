'use server';

import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Crea o actualiza el presupuesto de una categoría.
 * Usa upsert sobre la restricción unique (household_id, category).
 */
export async function setBudget(formData: FormData) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const category = String(formData.get('category') || '').trim();
  const amount = Number(formData.get('amount'));

  if (!category || isNaN(amount) || amount <= 0) return;

  const { error } = await supabase
    .from('budgets')
    .upsert(
      { household_id: householdId, category, amount },
      { onConflict: 'household_id,category' }
    );

  if (error) console.error('Error guardando presupuesto:', error.message);

  revalidatePath('/finanzas/budgets');
  revalidatePath('/finanzas/dashboard');
}

export async function deleteBudget(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get('id') || '');
  if (!id) return;

  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) console.error('Error eliminando presupuesto:', error.message);

  revalidatePath('/finanzas/budgets');
  revalidatePath('/finanzas/dashboard');
}
