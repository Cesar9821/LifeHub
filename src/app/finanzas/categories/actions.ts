'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';
import { failIf } from '@/lib/errors';
import { parseForm, errorState, successState, zRequiredText, type FormState } from '@/lib/action';
import { revalidatePath } from 'next/cache';

const categorySchema = z.object({
  name: zRequiredText('El nombre'),
  kind: z.enum(['income', 'expense']).default('expense'),
  icon: z.string().trim().min(1).default('Tag'),
});

export async function addCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(categorySchema, formData);
  if (!parsed.success) return parsed.state;
  const { name, kind, icon } = parsed.data;

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const { error } = await supabase.from('categories').insert([
    { household_id: householdId, name, kind, icon },
  ]);

  if (error) {
    // El unique (household_id, name, kind) evita duplicados.
    if (error.message?.includes('duplicate')) {
      return errorState('Ya existe una categoría con ese nombre.');
    }
    console.error('Error creando categoría:', error.message);
    return errorState('No se pudo crear la categoría.');
  }

  revalidatePath('/finanzas/categories');
  revalidatePath('/finanzas/movimientos');
  revalidatePath('/finanzas/planificacion');
  return successState('Categoría agregada.');
}

export async function deleteCategory(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get('id') || '');
  if (!id) return;

  const { error } = await supabase.from('categories').delete().eq('id', id);
  failIf(error, 'No se pudo eliminar la categoría');

  revalidatePath('/finanzas/categories');
  revalidatePath('/finanzas/movimientos');
  revalidatePath('/finanzas/planificacion');
}
