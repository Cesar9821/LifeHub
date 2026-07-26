'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';
import { failIf } from '@/lib/errors';
import {
  parseForm,
  errorState,
  successState,
  zRequiredText,
  zAmount,
  zCheckbox,
  type FormState,
} from '@/lib/action';
import { revalidatePath } from 'next/cache';

const recurringSchema = z.object({
  description: zRequiredText('La descripción'),
  kind: z.enum(['income', 'expense']).default('expense'),
  amount: zAmount,
  due_day: z.coerce
    .number({ error: 'Día inválido.' })
    .int()
    .min(1, 'El día debe estar entre 1 y 31.')
    .max(31, 'El día debe estar entre 1 y 31.'),
  category: z.string().trim().min(1).default('General'),
  is_variable: zCheckbox,
});

export async function addRecurring(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(recurringSchema, formData);
  if (!parsed.success) return parsed.state;
  const { description, kind, amount, due_day, category, is_variable } = parsed.data;

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

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

  if (error) {
    console.error('Error creando recurrente:', error.message);
    return errorState('No se pudo crear el recurrente. Inténtalo de nuevo.');
  }

  revalidatePath('/finanzas/planificacion');
  revalidatePath('/finanzas/movimientos');
  return successState('Recurrente agregado.');
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
