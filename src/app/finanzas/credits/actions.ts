'use server'

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';
import { failIf } from '@/lib/errors';
import {
  parseForm,
  errorState,
  successState,
  zRequiredText,
  zAmount,
  type FormState,
} from '@/lib/action';
import { revalidatePath } from 'next/cache';

const creditSchema = z.object({
  name: zRequiredText('El nombre'),
  total_amount: zAmount,
  installment_value: zAmount,
  paid_installments: z.coerce.number({ error: 'Valor inválido.' }).int().min(0).default(0),
  total_installments: z.coerce
    .number({ error: 'Valor inválido.' })
    .int()
    .min(1, 'Debe haber al menos 1 cuota.')
    .default(1),
});

export async function addCredit(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(creditSchema, formData);
  if (!parsed.success) return parsed.state;
  const { name, total_amount, installment_value, paid_installments, total_installments } =
    parsed.data;

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const calculated_remaining = total_amount - paid_installments * installment_value;

  const { error } = await supabase.from('credits').insert([
    {
      household_id: householdId,
      name,
      total_amount,
      remaining_amount: calculated_remaining,
      installment_value,
      paid_installments,
      total_installments,
    },
  ]);

  if (error) {
    console.error('Error al registrar crédito:', error.message);
    return errorState('No se pudo registrar el crédito.');
  }

  revalidatePath('/finanzas/credits');
  revalidatePath('/finanzas/movimientos');
  return successState('Crédito registrado.');
}
export async function deleteCredit(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('credits').delete().eq('id', id);
  revalidatePath('/finanzas/credits');
  revalidatePath('/finanzas/dashboard');
  revalidatePath('/finanzas/performance');
}

/**
 * Paga una cuota del crédito: baja el saldo pendiente, sube las cuotas pagadas
 * y registra el pago como movimiento confirmado del mes.
 */
export async function payCreditInstallment(formData: FormData) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const id = String(formData.get('id') || '');
  const customAmount = Number(formData.get('amount'));

  if (!id) return;

  const { data: credit } = await supabase
    .from('credits')
    .select('name, remaining_amount, installment_value, paid_installments, total_installments')
    .eq('id', id)
    .maybeSingle();

  if (!credit) return;

  const amount =
    !isNaN(customAmount) && customAmount > 0
      ? customAmount
      : Number(credit.installment_value || 0);

  if (amount <= 0) return;

  const newRemaining = Math.max(0, Number(credit.remaining_amount || 0) - amount);
  const newPaid = Math.min(
    Number(credit.total_installments || 1),
    Number(credit.paid_installments || 0) + 1
  );

  const { error: upErr } = await supabase
    .from('credits')
    .update({ remaining_amount: newRemaining, paid_installments: newPaid })
    .eq('id', id);
  failIf(upErr, 'No se pudo registrar el pago del crédito');

  const today = new Date();
  const dueDate = today.toISOString().slice(0, 10);
  const period = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const { error: movErr } = await supabase.from('movements').insert([
    {
      household_id: householdId,
      recurring_id: null,
      description: `Cuota ${newPaid}/${credit.total_installments}: ${credit.name}`,
      kind: 'expense',
      category: 'Crédito',
      estimated_amount: amount,
      actual_amount: amount,
      status: 'confirmed',
      confirmed_at: today.toISOString(),
      due_date: dueDate,
      period_month: period,
    },
  ]);
  if (movErr) console.error('Error registrando movimiento:', movErr.message);

  revalidatePath('/finanzas/credits');
  revalidatePath('/finanzas/movimientos');
  revalidatePath('/finanzas/dashboard');
}
