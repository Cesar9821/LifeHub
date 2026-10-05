'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId, requireUser } from '@/lib/auth';
import { errorState, parseForm, successState, zOptionalText, zRequiredText, type FormState } from '@/lib/action';
import { isMissingSchema, PLANNING_SQL_MISSING } from '@/lib/db-errors';

const projectSchema = z.object({
  id: z.string().optional(),
  name: zRequiredText('El nombre'),
  status: z.enum(['idea', 'preparacion', 'activo', 'pausado', 'terminado']).default('activo'),
  priority: z.enum(['alta', 'normal', 'baja']).default('normal'),
  next_action: zOptionalText,
  weekly_hours: z
    .string()
    .optional()
    .transform((v) => {
      const n = Number(String(v ?? '').replace(',', '.'));
      return Number.isFinite(n) && n > 0 ? Math.min(168, n) : 0;
    }),
  notes: zOptionalText,
  shared: z
    .string()
    .optional()
    .transform((v) => (v === 'on' ? 'household' : 'private')),
});

export async function saveProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(projectSchema, formData);
  if (!parsed.success) return parsed.state;
  const d = parsed.data;
  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  const fields = {
    name: d.name,
    status: d.status,
    priority: d.priority,
    next_action: d.next_action,
    weekly_minutes: Math.round(d.weekly_hours * 60),
    notes: d.notes,
    visibility: d.shared,
  };
  const { error } = d.id
    ? await supabase.from('projects').update(fields).eq('id', d.id).eq('household_id', householdId)
    : await supabase.from('projects').insert([{ ...fields, household_id: householdId, user_id: user.id }]);
  if (error) {
    if (isMissingSchema(error)) return errorState(PLANNING_SQL_MISSING);
    console.error('Error guardando proyecto:', error.message);
    return errorState('No pudimos guardar el proyecto. Inténtalo nuevamente.');
  }
  revalidatePath('/', 'layout');
  return successState(d.id ? 'Proyecto actualizado.' : 'Proyecto creado.');
}

/** Elimina el proyecto. Sus tareas y bloques quedan, sin proyecto. */
export async function deleteProject(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const { error } = await supabase.from('projects').delete().eq('id', id).eq('household_id', householdId);
  if (error) console.error('Error eliminando proyecto:', error.message);
  revalidatePath('/', 'layout');
  redirect('/proyectos');
}
