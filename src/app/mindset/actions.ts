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
  zCheckbox,
  type FormState,
} from '@/lib/action';
import { revalidatePath } from 'next/cache';

function revalidateAll() {
  revalidatePath('/mindset');
  revalidatePath('/mindset/habitos');
  revalidatePath('/mindset/forja');
}

const M369_TARGETS = { morning: 3, afternoon: 6, night: 9 } as const;

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
  non_negotiable: zCheckbox,
});

export async function addHabit(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(habitSchema, formData);
  if (!parsed.success) return parsed.state;
  const { name, description, kind, frequency, target_per_week, icon, non_negotiable } = parsed.data;

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
      non_negotiable,
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
  non_negotiable: zCheckbox,
});

export async function updateHabit(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(updateHabitSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, name, description, kind, frequency, target_per_week, non_negotiable } = parsed.data;

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
      non_negotiable,
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
export async function saveDailyLog(_prev: FormState, formData: FormData): Promise<FormState> {
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
    reflection: String(formData.get('reflection') || '').trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('daily_logs')
    .upsert(payload, { onConflict: 'user_id,log_date' });

  if (error) {
    console.error('Error guardando registro diario:', error.message);
    return errorState('No se pudo guardar el registro.');
  }

  revalidateAll();
  return successState('Registro guardado.');
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

/* ------------------------------------------------------------------ */
/*  MÉTODO 369 — La Forja                                             */
/* ------------------------------------------------------------------ */

const affirmation369Schema = z.object({
  affirmation: zRequiredText('La afirmación'),
});

/** Guarda (o actualiza) la afirmación/meta del día para el método 369. */
export async function save369Affirmation(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(affirmation369Schema, formData);
  if (!parsed.success) return parsed.state;

  const supabase = await createClient();
  const user = await requireUser();

  const { error } = await supabase.from('mindset_369').upsert(
    {
      user_id: user.id,
      log_date: todayStr(),
      affirmation: parsed.data.affirmation,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,log_date' }
  );

  if (error) {
    console.error('Error guardando afirmación 369:', error.message);
    return errorState('No se pudo guardar la afirmación.');
  }

  revalidateAll();
  return successState('Afirmación guardada.');
}

/** Registra una repetición del bloque (mañana/tarde/noche), tope 3/6/9. */
export async function add369Rep(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();

  const block = String(formData.get('block') || '') as 'morning' | 'afternoon' | 'night';
  if (!(block in M369_TARGETS)) return;

  const today = todayStr();
  const { data: row } = await supabase
    .from('mindset_369')
    .select('morning, afternoon, night')
    .eq('user_id', user.id)
    .eq('log_date', today)
    .maybeSingle();

  const current = (row as Record<string, number> | null)?.[block] ?? 0;
  const next = Math.min(M369_TARGETS[block], current + 1);

  const { error } = await supabase.from('mindset_369').upsert(
    {
      user_id: user.id,
      log_date: today,
      [block]: next,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,log_date' }
  );

  failIf(error, 'No se pudo registrar la repetición');
  revalidateAll();
}

/* ------------------------------------------------------------------ */
/*  LA RANA — la tarea #1 del día (Brian Tracy: "Eat That Frog")       */
/* ------------------------------------------------------------------ */

const topTaskSchema = z.object({ top_task: zRequiredText('La rana') });

/** Define la tarea más importante del día. */
export async function setTopTask(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(topTaskSchema, formData);
  if (!parsed.success) return parsed.state;

  const supabase = await createClient();
  const user = await requireUser();

  const { error } = await supabase.from('daily_logs').upsert(
    { user_id: user.id, log_date: todayStr(), top_task: parsed.data.top_task, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,log_date' }
  );

  if (error) {
    console.error('Error guardando la rana:', error.message);
    return errorState('No se pudo guardar la rana.');
  }

  revalidateAll();
  return successState('Rana definida. Cómetela primero. 🐸');
}

/** Marca/desmarca la rana como conquistada. */
export async function toggleTopTask(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();
  const done = formData.get('done') === 'true';

  const { error } = await supabase.from('daily_logs').upsert(
    { user_id: user.id, log_date: todayStr(), top_task_done: !done, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,log_date' }
  );

  failIf(error, 'No se pudo actualizar la rana');
  revalidateAll();
}
