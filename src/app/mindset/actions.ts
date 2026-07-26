'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser, getActiveHouseholdId } from '@/lib/auth';
import { todayStr } from '@/services/mindset';
import { failIf } from '@/lib/errors';
import {
  parseForm,
  errorState,
  successState,
  zRequiredText,
  zOptionalText,
  type FormState,
} from '@/lib/action';
import { revalidatePath } from 'next/cache';

function revalidateAll() {
  revalidatePath('/mindset');
  revalidatePath('/mindset/habitos');
}

/** Marca o desmarca un hábito para HOY (el pasado no se toca). */
export async function toggleHabit(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();

  const habitId = String(formData.get('habit_id') || '');
  const currentlyDone = formData.get('done') === 'true';
  if (!habitId) return;

  const today = todayStr();

  if (currentlyDone) {
    // Desmarcar: borra el registro de hoy
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('user_id', user.id)
      .eq('log_date', today);
    failIf(error, 'No se pudo desmarcar el hábito');
  } else {
    // Marcar: inserta el registro de hoy
    const { error } = await supabase.from('habit_logs').insert([
      { habit_id: habitId, user_id: user.id, log_date: today, done: true },
    ]);
    // El registro único por día evita duplicados; ignoramos ese error.
    if (!error?.message?.includes('duplicate')) {
      failIf(error, 'No se pudo marcar el hábito');
    }
  }

  revalidateAll();
}

const habitSchema = z.object({
  name: zRequiredText('El hábito'),
  description: zOptionalText,
  kind: z.enum(['build', 'break']).default('build'),
  frequency: z.enum(['daily', 'weekly']).default('daily'),
  target_per_week: z.coerce.number().int().min(1).max(7).default(7),
  icon: z.string().trim().min(1).default('Flame'),
});

export async function addHabit(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(habitSchema, formData);
  if (!parsed.success) return parsed.state;
  const { name, description, kind, frequency, target_per_week, icon } = parsed.data;

  const supabase = await createClient();
  const user = await requireUser();

  let householdId: string | null = null;
  try {
    householdId = await getActiveHouseholdId();
  } catch {
    householdId = null;
  }

  const { error } = await supabase.from('habits').insert([
    {
      user_id: user.id,
      household_id: householdId,
      name,
      description,
      kind,
      frequency,
      target_per_week: frequency === 'daily' ? 7 : target_per_week,
      icon,
      is_active: true,
    },
  ]);

  if (error) {
    console.error('Error creando hábito:', error.message);
    return errorState('No se pudo crear el hábito. Inténtalo de nuevo.');
  }

  revalidateAll();
  return successState('Hábito creado.');
}

const updateHabitSchema = z.object({
  id: z.string().min(1),
  name: zRequiredText('El hábito'),
  description: zOptionalText,
  kind: z.enum(['build', 'break']).default('build'),
  frequency: z.enum(['daily', 'weekly']).default('daily'),
  target_per_week: z.coerce.number().int().min(1).max(7).default(7),
});

export async function updateHabit(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(updateHabitSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, name, description, kind, frequency, target_per_week } = parsed.data;

  const supabase = await createClient();
  const user = await requireUser();

  const { error } = await supabase
    .from('habits')
    .update({
      name,
      description,
      kind,
      frequency,
      target_per_week: frequency === 'daily' ? 7 : target_per_week,
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error editando hábito:', error.message);
    return errorState('No se pudo guardar el hábito.');
  }

  revalidateAll();
  return successState('Hábito actualizado.');
}

export async function deleteHabit(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();
  const id = String(formData.get('id') || '');
  if (!id) return;

  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  failIf(error, 'No se pudo eliminar el hábito');

  revalidateAll();
}

/** Pausa/reactiva un hábito sin borrar su historial. */
export async function toggleHabitActive(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();
  const id = String(formData.get('id') || '');
  const isActive = formData.get('is_active') === 'true';
  if (!id) return;

  const { error } = await supabase
    .from('habits')
    .update({ is_active: !isActive })
    .eq('id', id)
    .eq('user_id', user.id);
  failIf(error, 'No se pudo cambiar el estado del hábito');

  revalidateAll();
}

/** Guarda el registro diario de hoy (sueño, ánimo, energía, agua, peso). */
export async function saveDailyLog(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();

  const num = (key: string) => {
    const raw = formData.get(key);
    if (raw === null || String(raw).trim() === '') return null;
    const n = Number(raw);
    return isNaN(n) ? null : n;
  };

  const payload = {
    user_id: user.id,
    log_date: todayStr(),
    sleep_hours: num('sleep_hours'),
    mood: num('mood'),
    energy: num('energy'),
    water_ml: num('water_ml') ?? 0,
    weight_kg: num('weight_kg'),
    note: String(formData.get('note') || '').trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('daily_logs')
    .upsert(payload, { onConflict: 'user_id,log_date' });

  failIf(error, 'No se pudo guardar el registro diario');
  revalidateAll();
}

/** Suma agua rápido (vasos de 250ml). */
export async function addWater(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();
  const ml = Number(formData.get('ml')) || 250;
  const today = todayStr();

  const { data: existing } = await supabase
    .from('daily_logs')
    .select('water_ml')
    .eq('user_id', user.id)
    .eq('log_date', today)
    .maybeSingle();

  const newTotal = Math.max(0, Number(existing?.water_ml || 0) + ml);

  const { error } = await supabase.from('daily_logs').upsert(
    {
      user_id: user.id,
      log_date: today,
      water_ml: newTotal,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,log_date' }
  );

  failIf(error, 'No se pudo registrar el agua');
  revalidateAll();
}
