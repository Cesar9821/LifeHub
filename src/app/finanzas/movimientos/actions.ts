'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';
import { periodOf } from '@/services/movements';
import { failIf } from '@/lib/errors';
import {
  parseForm,
  errorState,
  successState,
  zRequiredText,
  zCheckbox,
  type FormState,
} from '@/lib/action';
import { revalidatePath } from 'next/cache';

const variableSchema = z.object({
  description: zRequiredText('La descripción'),
  kind: z.enum(['income', 'expense']).default('expense'),
  amount: z
    .union([z.string(), z.number()])
    .transform((v) => Number(String(v).replace(/\./g, '')))
    .pipe(z.number({ error: 'Monto inválido.' }).positive('Ingresa un monto mayor a 0.')),
  category: z.string().trim().min(1).default('General'),
  due_date: z.string().optional().default(''),
  confirm_now: zCheckbox,
});

function revalidateAll() {
  revalidatePath('/finanzas/movimientos');
  revalidatePath('/finanzas/dashboard');
  revalidatePath('/finanzas/performance');
}

/**
 * Confirma un movimiento (marcar pagado/recibido).
 * Si es de monto variable, usa el monto real ingresado; si no, el estimado.
 * El trigger de la DB crea la transacción y descuenta del saldo.
 */
export async function confirmMovement(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get('id') || '');
  if (!id) return;

  const rawAmount = formData.get('actual_amount');
  const actualAmount =
    rawAmount !== null && String(rawAmount).trim() !== ''
      ? Number(rawAmount)
      : null;

  const { error } = await supabase
    .from('movements')
    .update({
      status: 'confirmed',
      actual_amount: actualAmount, // si null, el trigger usa el estimado
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', id);

  failIf(error, 'No se pudo confirmar el movimiento');
  revalidateAll();
}

/** Revierte un movimiento confirmado a pendiente (borra su transacción). */
export async function revertMovement(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get('id') || '');
  if (!id) return;

  const { error } = await supabase
    .from('movements')
    .update({ status: 'pending' })
    .eq('id', id);

  failIf(error, 'No se pudo revertir el movimiento');
  revalidateAll();
}

/** Agrega un movimiento variable (gasto o ingreso puntual del mes). */
export async function addVariableMovement(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(variableSchema, formData);
  if (!parsed.success) return parsed.state;
  const { description, kind, amount, category, due_date, confirm_now } = parsed.data;

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const dueDate = due_date.trim() || new Date().toISOString().slice(0, 10);
  const period = periodOf(new Date(dueDate + 'T00:00:00'));

  const { error } = await supabase.from('movements').insert([
    {
      household_id: householdId,
      recurring_id: null,
      description,
      kind,
      category,
      estimated_amount: amount,
      actual_amount: confirm_now ? amount : null,
      status: confirm_now ? 'confirmed' : 'pending',
      confirmed_at: confirm_now ? new Date().toISOString() : null,
      due_date: dueDate,
      period_month: period,
    },
  ]);

  if (error) {
    console.error('Error agregando movimiento variable:', error.message);
    return errorState('No se pudo agregar el movimiento.');
  }

  revalidateAll();
  return successState(confirm_now ? 'Movimiento agregado y confirmado.' : 'Movimiento agregado.');
}

export async function deleteMovement(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get('id') || '');
  if (!id) return;

  const { error } = await supabase.from('movements').delete().eq('id', id);
  failIf(error, 'No se pudo eliminar el movimiento');
  revalidateAll();
}

/**
 * Edita el monto estimado de un pendiente (antes de confirmar).
 * Solo aplica a movimientos en estado 'pending'.
 */
export async function editMovementAmount(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get('id') || '');
  const amount = Number(formData.get('amount'));

  if (!id || isNaN(amount) || amount <= 0) return;

  const { error } = await supabase
    .from('movements')
    .update({ estimated_amount: amount })
    .eq('id', id)
    .eq('status', 'pending');

  failIf(error, 'No se pudo editar el monto');
  revalidateAll();
}
