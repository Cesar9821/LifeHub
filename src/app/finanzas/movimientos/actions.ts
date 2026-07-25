'use server';

import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';
import { periodOf } from '@/services/movements';
import { failIf } from '@/lib/errors';
import { revalidatePath } from 'next/cache';

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
export async function addVariableMovement(formData: FormData) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const description = String(formData.get('description') || '').trim();
  const kind = String(formData.get('kind') || 'expense');
  const amount = Number(formData.get('amount')) || 0;
  const category = String(formData.get('category') || 'General');
  const dueDate = String(formData.get('due_date') || '') || new Date().toISOString().slice(0, 10);
  const confirmNow = formData.get('confirm_now') === 'on';

  if (!description || amount <= 0) return;
  if (kind !== 'income' && kind !== 'expense') return;

  const period = periodOf(new Date(dueDate + 'T00:00:00'));

  const { error } = await supabase.from('movements').insert([
    {
      household_id: householdId,
      recurring_id: null,
      description,
      kind,
      category,
      estimated_amount: amount,
      actual_amount: confirmNow ? amount : null,
      status: confirmNow ? 'confirmed' : 'pending',
      confirmed_at: confirmNow ? new Date().toISOString() : null,
      due_date: dueDate,
      period_month: period,
    },
  ]);

  failIf(error, 'No se pudo agregar el movimiento');
  revalidateAll();
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
