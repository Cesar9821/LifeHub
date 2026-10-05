'use server'

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';
import { failIf } from '@/lib/errors';
import { parseForm, errorState, successState, zRequiredText, type FormState } from '@/lib/action';
import { revalidatePath } from 'next/cache';

const savingSchema = z.object({
  name: zRequiredText('El nombre'),
  target_amount: z
    .union([z.string(), z.number()])
    .transform((v) => Number(String(v).replace(/\./g, '').replace(/,/g, '')))
    .pipe(z.number({ error: 'Monto inválido.' }).positive('Ingresa un monto mayor a 0.')),
});

export async function addSaving(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(savingSchema, formData);
  if (!parsed.success) return parsed.state;
  const { name, target_amount } = parsed.data;

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const { error } = await supabase.from('savings').insert([
    {
      household_id: householdId,
      name,
      target_amount,
      current_amount: 0,
    }
  ]);

  if (error) {
    console.error('Error saving goal:', error.message);
    return errorState('No se pudo crear la meta de ahorro.');
  }

  revalidatePath('/finanzas/savings');
  revalidatePath('/finanzas/movimientos');
  revalidatePath('/finanzas/dashboard');
  return successState('Meta de ahorro creada.');
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
