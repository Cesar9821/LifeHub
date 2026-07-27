'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';
import { failIf } from '@/lib/errors';
import { parseForm, errorState, successState, zRequiredText, zAmount, type FormState } from '@/lib/action';
import { revalidatePath } from 'next/cache';

const budgetSchema = z.object({
  category: zRequiredText('La categoría'),
  amount: zAmount,
});

/** Crea o actualiza el presupuesto mensual de una categoría. */
export async function setBudget(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(budgetSchema, formData);
  if (!parsed.success) return parsed.state;
  const { category, amount } = parsed.data;

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const { error } = await supabase
    .from('budgets')
    .upsert({ household_id: householdId, category, amount }, { onConflict: 'household_id,category' });

  if (error) {
    console.error('Error guardando presupuesto:', error.message);
    return errorState('No se pudo guardar el presupuesto.');
  }

  revalidatePath('/finanzas/presupuestos');
  revalidatePath('/finanzas/dashboard');
  return successState('Presupuesto guardado.');
}

/** Elimina el presupuesto de una categoría. */
export async function deleteBudget(formData: FormData) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const category = String(formData.get('category') || '');
  if (!category) return;

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('household_id', householdId)
    .eq('category', category);

  failIf(error, 'No se pudo eliminar el presupuesto');
  revalidatePath('/finanzas/presupuestos');
}
