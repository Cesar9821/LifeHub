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
  revalidatePath('/metas');
}

/** Objetivo numérico opcional: '' o ausente → null; si viene, > 0. */
const zTargetValue = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v === undefined) return null;
    const s = String(v).replace(/\./g, '').replace(/,/g, '').trim();
    return s === '' ? null : Number(s);
  })
  .refine((v) => v === null || (Number.isFinite(v) && v > 0), 'El objetivo debe ser mayor a 0.');

const goalSchema = z.object({
  title: zRequiredText('El objetivo'),
  description: zOptionalText,
  motive: zOptionalText,
  category: z.string().trim().min(1).default('Personal'),
  target_date: zOptionalDate,
  target_value: zTargetValue,
  unit: zOptionalText,
  saving_id: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== '' ? v.trim() : null)),
});

/** Crea una meta nueva. Contrato FormState (useActionState). */
export async function addGoal(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(goalSchema, formData);
  if (!parsed.success) return parsed.state;
  const { title, description, motive, category, target_date, target_value, unit, saving_id } = parsed.data;

  const supabase = await createClient();
  const user = await requireUser();

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
      motive,
      category,
      target_date,
      target_value,
      unit: target_value != null ? unit || '$' : null,
      saving_id,
      status: 'active',
    },
  ]);

  if (error) {
    console.error('Error creando meta:', error.message);
    return errorState('No se pudo crear la meta. Inténtalo de nuevo.');
  }

  revalidate();
  return successState('Meta creada.');
}

const updateGoalSchema = z.object({
  id: z.string().min(1),
  title: zRequiredText('El objetivo'),
  description: zOptionalText,
  motive: zOptionalText,
  category: z.string().trim().min(1).default('Personal'),
  target_date: zOptionalDate,
  target_value: zTargetValue,
  unit: zOptionalText,
});

/** Edita los datos de una meta existente. Contrato FormState. */
export async function updateGoal(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(updateGoalSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, title, description, motive, category, target_date, target_value, unit } = parsed.data;

  const supabase = await createClient();
  const user = await requireUser();

  const { error } = await supabase
    .from('goals')
    .update({
      title,
      description,
      motive,
      category,
      target_date,
      target_value,
      unit: target_value != null ? unit || '$' : null,
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error editando meta:', error.message);
    return errorState('No se pudo guardar los cambios.');
  }

  revalidate();
  return successState('Cambios guardados.');
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

const progressSchema = z.object({
  id: z.string().min(1),
  amount: z
    .union([z.string(), z.number()])
    .transform((v) => Number(String(v).replace(/\./g, '').replace(/,/g, '')))
    .pipe(z.number({ error: 'Monto inválido.' }).refine((n) => n !== 0, 'Ingresa un monto.')),
});

/** Registra avance en una meta medible por monto/cantidad (suma; puede ser negativo). */
export async function addGoalProgress(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(progressSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, amount } = parsed.data;

  const supabase = await createClient();
  const user = await requireUser();

  const { data: goal } = await supabase
    .from('goals')
    .select('current_value')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!goal) return errorState('Meta no encontrada.');

  const newValue = Math.max(0, Number(goal.current_value || 0) + amount);

  const { error } = await supabase
    .from('goals')
    .update({ current_value: newValue })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error registrando avance:', error.message);
    return errorState('No se pudo registrar el avance.');
  }

  revalidate();
  return successState('Avance registrado.');
}

/** Reordena una meta activa (sube/baja), reasignando sort_order secuencial. */
export async function moveGoal(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();

  const id = String(formData.get('id') || '');
  const dir = String(formData.get('dir') || '');
  if (!id || (dir !== 'up' && dir !== 'down')) return;

  const { data: goals } = await supabase
    .from('goals')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (!goals) return;

  const ids = goals.map((g) => g.id as string);
  const idx = ids.indexOf(id);
  const swap = dir === 'up' ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= ids.length) return;

  [ids[idx], ids[swap]] = [ids[swap], ids[idx]];

  await Promise.all(
    ids.map((gid, i) =>
      supabase.from('goals').update({ sort_order: i }).eq('id', gid).eq('user_id', user.id)
    )
  );

  revalidate();
}
