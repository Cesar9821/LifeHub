'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser, getActiveHouseholdId } from '@/lib/auth';
import { failIf } from '@/lib/errors';
import { revalidatePath } from 'next/cache';

function revalidate() {
  revalidatePath('/metas');
}

/** Crea una meta nueva. */
export async function addGoal(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim() || null;
  const category = String(formData.get('category') || 'Personal');
  const targetDate = String(formData.get('target_date') || '') || null;

  if (!title) return;

  // household_id es opcional (solo contexto); si falla, la meta sigue siendo personal.
  let householdId: string | null = null;
  try {
    householdId = await getActiveHouseholdId();
  } catch {
    householdId = null;
  }

  const { error } = await supabase.from('goals').insert([
    {
      user_id: user.id,
      household_id: householdId,
      title,
      description,
      category,
      target_date: targetDate,
      status: 'active',
    },
  ]);

  failIf(error, 'No se pudo crear la meta');
  revalidate();
}

/** Cambia el estado de una meta: activa, completada o archivada. */
export async function setGoalStatus(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();

  const id = String(formData.get('id') || '');
  const status = String(formData.get('status') || '');
  if (!id || !['active', 'done', 'archived'].includes(status)) return;

  const { error } = await supabase
    .from('goals')
    .update({
      status,
      completed_at: status === 'done' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .eq('user_id', user.id);

  failIf(error, 'No se pudo cambiar el estado de la meta');
  revalidate();
}

/** Elimina una meta (y sus hitos por cascada). */
export async function deleteGoal(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();

  const id = String(formData.get('id') || '');
  if (!id) return;

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  failIf(error, 'No se pudo eliminar la meta');
  revalidate();
}

/** Agrega un hito a una meta. */
export async function addMilestone(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();

  const goalId = String(formData.get('goal_id') || '');
  const title = String(formData.get('title') || '').trim();
  if (!goalId || !title) return;

  const { error } = await supabase.from('goal_milestones').insert([
    { goal_id: goalId, user_id: user.id, title, done: false },
  ]);

  failIf(error, 'No se pudo agregar el hito');
  revalidate();
}

/** Marca/desmarca un hito. */
export async function toggleMilestone(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();

  const id = String(formData.get('id') || '');
  const done = formData.get('done') === 'true';
  if (!id) return;

  const { error } = await supabase
    .from('goal_milestones')
    .update({ done: !done })
    .eq('id', id)
    .eq('user_id', user.id);

  failIf(error, 'No se pudo actualizar el hito');
  revalidate();
}

/** Elimina un hito. */
export async function deleteMilestone(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();

  const id = String(formData.get('id') || '');
  if (!id) return;

  const { error } = await supabase
    .from('goal_milestones')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  failIf(error, 'No se pudo eliminar el hito');
  revalidate();
}
