'use server'

import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';
import { failIf } from '@/lib/errors';
import { revalidatePath } from 'next/cache';

export async function addSaving(formData: FormData) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const name = formData.get('name') as string;
  const target_amount = parseFloat(formData.get('target_amount') as string);

  if (!name || isNaN(target_amount) || target_amount <= 0) return;

  const { error } = await supabase.from('savings').insert([
    {
      household_id: householdId,
      name,
      target_amount,
      current_amount: 0,
    }
  ]);

  failIf(error, 'No se pudo crear la meta de ahorro');

  revalidatePath('/finanzas/savings');
  revalidatePath('/finanzas/movimientos');
  revalidatePath('/finanzas/dashboard');
}

export async function deleteSaving(id: string) {
  const supabase = await createClient();
  await supabase.from('savings').delete().eq('id', id);
  revalidatePath('/finanzas/savings');
  revalidatePath('/finanzas/dashboard');
  revalidatePath('/finanzas/movimientos');
}

/**
 * Abona (o retira) dinero de un ahorro y lo registra como movimiento del mes.
 * Un abono es un gasto (sale de tu bolsillo hacia el ahorro).
 * Un retiro es un ingreso (vuelve a tu bolsillo).
 */
export async function depositSaving(formData: FormData) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const id = String(formData.get('id') || '');
  const amount = Number(formData.get('amount'));
  const mode = String(formData.get('mode') || 'deposit'); // deposit | withdraw

  if (!id || isNaN(amount) || amount <= 0) return;

  const { data: saving } = await supabase
    .from('savings')
    .select('name, current_amount')
    .eq('id', id)
    .maybeSingle();

  if (!saving) return;

  const isDeposit = mode === 'deposit';
  const delta = isDeposit ? amount : -amount;
  const newAmount = Math.max(0, Number(saving.current_amount || 0) + delta);

  // Actualiza el ahorro
  const { error: upErr } = await supabase
    .from('savings')
    .update({ current_amount: newAmount })
    .eq('id', id);
  failIf(upErr, 'No se pudo registrar el movimiento de ahorro');

  // Registra el movimiento (confirmado, porque el dinero ya se movió)
  const today = new Date();
  const dueDate = today.toISOString().slice(0, 10);
  const period = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const { error: movErr } = await supabase.from('movements').insert([
    {
      household_id: householdId,
      recurring_id: null,
      description: isDeposit
        ? `Abono a ahorro: ${saving.name}`
        : `Retiro de ahorro: ${saving.name}`,
      kind: isDeposit ? 'expense' : 'income',
      category: 'Ahorro',
      estimated_amount: amount,
      actual_amount: amount,
      status: 'confirmed',
      confirmed_at: today.toISOString(),
      due_date: dueDate,
      period_month: period,
    },
  ]);
  if (movErr) console.error('Error registrando movimiento:', movErr.message);

  revalidatePath('/finanzas/savings');
  revalidatePath('/finanzas/movimientos');
  revalidatePath('/finanzas/dashboard');
}
