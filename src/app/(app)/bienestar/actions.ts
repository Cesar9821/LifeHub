'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId, requireUser } from '@/lib/auth';
import { addDays, todayStr } from '@/lib/format';
import { isMissingSchema } from '@/lib/db-errors';
import { errorState, parseForm, successState, zOptionalText, zRequiredText, type FormState } from '@/lib/action';
import { MAX_PRIORITIES, nextPosition } from '@/lib/planning/priorities';
import { isDateStr, weekStartOf } from '@/lib/planning/dates';
import { AREAS } from '@/lib/planning/areas';
import { tipById } from '@/lib/tips';
import { WHEEL_AREAS } from '@/lib/wellbeing';
import { WELLBEING_SQL_MISSING } from '@/services/wellbeing';

function revalidateAll() {
  revalidatePath('/', 'layout');
}

function dbError(error: { code?: string; message: string }, context: string): FormState {
  if (isMissingSchema(error)) return errorState(WELLBEING_SQL_MISSING);
  console.error(`${context}:`, error.message);
  return errorState('No pudimos guardar el cambio. Inténtalo nuevamente.');
}

/**
 * Escribe el registro diario con la fecha de Chile; si la base aún tiene el
 * trigger antiguo (fecha UTC), reintenta con la fecha UTC (igual que Hábitos).
 */
async function withLogDate<T extends { error: { message: string } | null }>(run: (date: string) => PromiseLike<T>): Promise<T> {
  const chile = todayStr();
  const first = await run(chile);
  const utc = new Date().toISOString().slice(0, 10);
  if (first.error && /Solo puedes registrar el día de hoy/.test(first.error.message) && utc !== chile) return run(utc);
  return first;
}

/* ------------------------------------------------------------------ */
/*  Consejo del día                                                    */
/* ------------------------------------------------------------------ */

/** Guarda o quita un consejo de tus favoritos. */
export async function toggleTipFavorite(formData: FormData): Promise<FormState> {
  const tipId = String(formData.get('tip_id') || '');
  const isFav = formData.get('fav') === 'true';
  if (!tipById(tipId)) return errorState('Ese consejo no existe.');

  const supabase = await createClient();
  const user = await requireUser();
  const { error } = isFav
    ? await supabase.from('tip_favorites').delete().eq('user_id', user.id).eq('tip_id', tipId)
    : await supabase.from('tip_favorites').upsert([{ user_id: user.id, tip_id: tipId }], { onConflict: 'user_id,tip_id' });
  if (error) return dbError(error, 'Error guardando favorito');
  revalidateAll();
  return successState(isFav ? 'Quitado de favoritos.' : 'Guardado en favoritos.');
}

/* ------------------------------------------------------------------ */
/*  Agua y sueño (en el registro diario que ya existía)               */
/* ------------------------------------------------------------------ */

/** Suma o resta un vaso de agua (250 ml). */
export async function changeWater(formData: FormData) {
  const delta = Number(formData.get('delta')) === -1 ? -1 : 1;
  const supabase = await createClient();
  const user = await requireUser();
  const { data } = await supabase.from('daily_logs').select('water_ml').eq('user_id', user.id).eq('log_date', todayStr()).maybeSingle();
  const ml = Math.max(0, Math.min(7500, Number(data?.water_ml ?? 0) + delta * 250));
  const { error } = await withLogDate((date) =>
    supabase
      .from('daily_logs')
      .upsert([{ user_id: user.id, log_date: date, water_ml: ml, updated_at: new Date().toISOString() }], { onConflict: 'user_id,log_date' })
  );
  if (error) console.error('Error guardando agua:', error.message);
  revalidateAll();
}

const sleepSchema = z.object({
  hours: z.coerce.number({ error: 'Indica las horas.' }).min(0, 'Revisa las horas.').max(16, 'Revisa las horas.'),
});

/** Horas dormidas anoche. */
export async function saveSleep(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(sleepSchema, formData);
  if (!parsed.success) return parsed.state;
  const supabase = await createClient();
  const user = await requireUser();
  const hours = Math.round(parsed.data.hours * 2) / 2;
  const { error } = await withLogDate((date) =>
    supabase
      .from('daily_logs')
      .upsert([{ user_id: user.id, log_date: date, sleep_hours: hours, updated_at: new Date().toISOString() }], { onConflict: 'user_id,log_date' })
  );
  if (error) return dbError(error, 'Error guardando sueño');
  revalidateAll();
  return successState('Sueño anotado.');
}

/* ------------------------------------------------------------------ */
/*  Cierre del día                                                     */
/* ------------------------------------------------------------------ */

const closingSchema = z.object({
  mood: z.coerce.number().int().min(1).max(5).optional(),
  went_well: zOptionalText,
  grateful: zOptionalText,
  tomorrow_first: zOptionalText,
});

/**
 * Cierra el día: qué salió bien, gratitud y lo primero de mañana. Lo de
 * mañana queda como prioridad del día siguiente (si hay espacio).
 */
export async function saveClosing(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(closingSchema, formData);
  if (!parsed.success) return parsed.state;
  const d = parsed.data;
  if (!d.went_well && !d.grateful && !d.tomorrow_first && !d.mood) {
    return errorState('Escribe al menos una respuesta.');
  }
  for (const [k, v, max] of [
    ['went_well', d.went_well, 500],
    ['grateful', d.grateful, 500],
    ['tomorrow_first', d.tomorrow_first, 200],
  ] as const) {
    if (v && v.length > max) return errorState('Revisa los datos ingresados.', { [k]: `Máximo ${max} caracteres.` });
  }

  const supabase = await createClient();
  const user = await requireUser();
  const fields: Record<string, unknown> = {
    went_well: d.went_well,
    grateful: d.grateful,
    tomorrow_first: d.tomorrow_first,
    closed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (d.mood) fields.mood = d.mood;
  const { error } = await withLogDate((date) =>
    supabase.from('daily_logs').upsert([{ user_id: user.id, log_date: date, ...fields }], { onConflict: 'user_id,log_date' })
  );
  if (error) return dbError(error, 'Error guardando cierre');

  let message = 'Día cerrado. Descansa.';
  if (d.tomorrow_first) {
    const tomorrow = addDays(todayStr(), 1);
    const householdId = await getActiveHouseholdId();
    const { data: existing, error: readError } = await supabase
      .from('daily_priorities')
      .select('position, title')
      .eq('user_id', user.id)
      .eq('day', tomorrow);
    if (!readError) {
      const rows = (existing as { position: number; title: string }[]) ?? [];
      const already = rows.some((r) => r.title.trim().toLowerCase() === d.tomorrow_first!.trim().toLowerCase());
      const position = nextPosition(rows.map((r) => Number(r.position)));
      if (already) message = 'Día cerrado. Lo de mañana ya estaba en tus prioridades.';
      else if (position === null) message = `Día cerrado. Mañana ya tiene ${MAX_PRIORITIES} prioridades.`;
      else {
        const { error: insError } = await supabase
          .from('daily_priorities')
          .insert([{ household_id: householdId, user_id: user.id, day: tomorrow, position, title: d.tomorrow_first.slice(0, 200) }]);
        if (!insError) message = 'Día cerrado. Mañana parte con eso como prioridad.';
        else console.error('Error creando prioridad de mañana:', insError.message);
      }
    }
  }

  revalidateAll();
  return successState(message);
}

/* ------------------------------------------------------------------ */
/*  Rueda de la vida                                                   */
/* ------------------------------------------------------------------ */

/** Guarda cómo sientes cada área esta semana (1 a 10). */
export async function saveWheel(_prev: FormState, formData: FormData): Promise<FormState> {
  const weekStart = String(formData.get('week_start') || '');
  if (!isDateStr(weekStart) || weekStartOf(weekStart) !== weekStart) return errorState('Semana inválida.');
  const wheel: Record<string, number> = {};
  for (const a of WHEEL_AREAS) {
    const v = Number(formData.get(a));
    if (!Number.isInteger(v) || v < 1 || v > 10) return errorState('Pon una nota del 1 al 10 en cada área.');
    wheel[a] = v;
  }
  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  const { error } = await supabase
    .from('weekly_plans')
    .upsert([{ household_id: householdId, user_id: user.id, week_start: weekStart, wheel }], { onConflict: 'user_id,week_start' });
  if (error) return dbError(error, 'Error guardando rueda');
  revalidateAll();
  return successState('Rueda guardada.');
}

/* ------------------------------------------------------------------ */
/*  Cumpleaños y fechas especiales                                     */
/* ------------------------------------------------------------------ */

const familyDateSchema = z.object({
  id: z.string().optional(),
  name: zRequiredText('El nombre'),
  kind: z.enum(['cumpleanos', 'aniversario', 'otro']).default('cumpleanos'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige la fecha.'),
  know_year: z.string().optional(),
  notes: zOptionalText,
});

/** Crea o edita una fecha especial del hogar. */
export async function saveFamilyDate(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(familyDateSchema, formData);
  if (!parsed.success) return parsed.state;
  const d = parsed.data;
  if (d.name.length > 120) return errorState('Revisa los datos ingresados.', { name: 'Máximo 120 caracteres.' });
  const [y, m, day] = d.date.split('-').map(Number);
  if (m < 1 || m > 12 || day < 1 || day > 31) return errorState('Revisa los datos ingresados.', { date: 'Fecha inválida.' });
  const year = d.know_year === 'on' && y >= 1900 && y <= 2100 ? y : null;

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const fields = { name: d.name, kind: d.kind, month: m, day, year, notes: d.notes };
  const { error } = d.id
    ? await supabase.from('family_dates').update(fields).eq('id', d.id).eq('household_id', householdId)
    : await supabase.from('family_dates').insert([{ ...fields, household_id: householdId }]);
  if (error) return dbError(error, 'Error guardando fecha');
  revalidateAll();
  return successState(d.id ? 'Cambios guardados.' : 'Fecha agregada.');
}

export async function deleteFamilyDate(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const { error } = await supabase.from('family_dates').delete().eq('id', id).eq('household_id', householdId);
  if (error) console.error('Error borrando fecha:', error.message);
  revalidateAll();
}

/* ------------------------------------------------------------------ */
/*  Tablero de visión                                                  */
/* ------------------------------------------------------------------ */

const visionSchema = z.object({
  id: z.string().optional(),
  title: zRequiredText('La frase'),
  image_data: zOptionalText,
  goal_id: zOptionalText,
});

/** Agrega o edita una imagen del tablero (la foto llega ya reducida desde el celular). */
export async function saveVisionItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(visionSchema, formData);
  if (!parsed.success) return parsed.state;
  const d = parsed.data;
  if (d.title.length > 120) return errorState('Revisa los datos ingresados.', { title: 'Máximo 120 caracteres.' });
  if (d.image_data && (!/^data:image\/(jpeg|png|webp);base64,/.test(d.image_data) || d.image_data.length > 700_000)) {
    return errorState('La foto es muy pesada o no es válida. Prueba con otra.');
  }
  if (!d.id && !d.image_data) return errorState('Elige una foto.');

  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  const fields: Record<string, unknown> = { title: d.title, goal_id: d.goal_id };
  if (d.image_data) fields.image_data = d.image_data;
  const { error } = d.id
    ? await supabase.from('vision_items').update(fields).eq('id', d.id).eq('user_id', user.id)
    : await supabase.from('vision_items').insert([{ ...fields, household_id: householdId, user_id: user.id }]);
  if (error) return dbError(error, 'Error guardando visión');
  revalidateAll();
  return successState(d.id ? 'Cambios guardados.' : 'Agregado a tu tablero.');
}

export async function deleteVisionItem(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  const supabase = await createClient();
  const user = await requireUser();
  const { error } = await supabase.from('vision_items').delete().eq('id', id).eq('user_id', user.id);
  if (error) console.error('Error borrando visión:', error.message);
  revalidateAll();
}

/* ------------------------------------------------------------------ */
/*  Modo enfoque                                                       */
/* ------------------------------------------------------------------ */

const focusSchema = z.object({
  minutes: z.coerce.number().int().min(1).max(600),
  task_id: zOptionalText,
  title: zOptionalText,
  area: zOptionalText,
  complete: z.string().optional(),
});

/** Registra una sesión de enfoque terminada (y marca la tarea si se pidió). */
export async function logFocusSession(formData: FormData): Promise<FormState> {
  const parsed = parseForm(focusSchema, formData);
  if (!parsed.success) return parsed.state;
  const d = parsed.data;
  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  const area = d.area && (AREAS as readonly string[]).includes(d.area) ? d.area : null;
  const { error } = await supabase.from('focus_sessions').insert([
    {
      household_id: householdId,
      user_id: user.id,
      task_id: d.task_id,
      title: d.title?.slice(0, 300) ?? null,
      area,
      minutes: d.minutes,
      day: todayStr(),
    },
  ]);
  if (error) return dbError(error, 'Error guardando enfoque');
  if (d.task_id && d.complete === 'true') {
    const { error: taskError } = await supabase
      .from('tasks')
      .update({ status: 'completado', completed_at: new Date().toISOString() })
      .eq('id', d.task_id)
      .eq('household_id', householdId);
    if (taskError) console.error('Error completando tarea:', taskError.message);
  }
  revalidateAll();
  return successState(`${d.minutes} min de enfoque. ¡Bien hecho!`);
}
