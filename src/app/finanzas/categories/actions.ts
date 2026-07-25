'use server';

import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function addCategory(formData: FormData) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const name = String(formData.get('name') || '').trim();
  const kind = String(formData.get('kind') || 'expense');
  const icon = String(formData.get('icon') || 'Tag');

  if (!name) return;
  if (kind !== 'income' && kind !== 'expense') return;

  const { error } = await supabase.from('categories').insert([
    { household_id: householdId, name, kind, icon },
  ]);

  // El unique (household_id, name, kind) evita duplicados; ignoramos ese error.
  if (error && !error.message.includes('duplicate')) {
    console.error('Error creando categoría:', error.message);
  }

  revalidatePath('/finanzas/categories');
  revalidatePath('/finanzas/movimientos');
  revalidatePath('/finanzas/planificacion');
}

export async function deleteCategory(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get('id') || '');
  if (!id) return;

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) console.error('Error eliminando categoría:', error.message);

  revalidatePath('/finanzas/categories');
  revalidatePath('/finanzas/movimientos');
  revalidatePath('/finanzas/planificacion');
}
