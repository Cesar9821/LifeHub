'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser, getActiveHouseholdId } from '@/lib/auth';
import { todayStr } from '@/services/mindset';
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
    if (error) console.error('Error desmarcando hábito:', error.message);
  } else {
    // Marcar: inserta el registro de hoy
    const { error } = await supabase.from('habit_logs').insert([
      { habit_id: habitId, user_id: user.id, log_date: today, done: true },
    ]);
    if (error && !error.message.includes('duplicate')) {
      console.error('Error marcando hábito:', error.message);
    }
  }

  revalidateAll();
}

export async function addHabit(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();

  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim() || null;
  const kind = String(formData.get('kind') || 'build');
  const frequency = String(formData.get('frequency') || 'daily');
  const targetPerWeek = Number(formData.get('target_per_week')) || 7;
  const icon = String(formData.get('icon') || 'Flame');

  if (!name) return;
  if (kind !== 'build' && kind !== 'break') return;
  if (frequency !== 'daily' && frequency !== 'weekly') return;

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
      target_per_week: frequency === 'daily' ? 7 : targetPerWeek,
      icon,
      is_active: true,
    },
  ]);

  if (error) console.error('Error creando hábito:', error.message);
  revalidateAll();
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
  if (error) console.error('Error eliminando hábito:', error.message);

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
  if (error) console.error('Error cambiando estado:', error.message);

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

  if (error) console.error('Error guardando registro diario:', error.message);
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

  if (error) console.error('Error registrando agua:', error.message);
  revalidateAll();
}
