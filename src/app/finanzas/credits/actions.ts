'use server'

import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';
import { failIf } from '@/lib/errors';
import { revalidatePath } from 'next/cache';

export async function addCredit(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const name = formData.get('name') as string;
  
  // CORRECCIÓN: Cambiado 'original_amount' por 'total_amount'
  const total_val = parseFloat(formData.get('total_amount') as string) || 0;
  
  const inst_val = parseFloat(formData.get('installment_value') as string) || 0;
  const paid_inst = parseInt(formData.get('paid_installments') as string) || 0;
  const total_inst = parseInt(formData.get('total_installments') as string) || 1;

  const calculated_remaining = total_val - (paid_inst * inst_val);

  const { error } = await supabase.from('credits').insert([
    {
      household_id: householdId,
      name: name,
      total_amount: total_val,       
      remaining_amount: calculated_remaining, 
      installment_value: inst_val,      
      paid_installments: paid_inst,     
      total_installments: total_inst    
    }
  ]);

  failIf(error, 'No se pudo registrar el crédito');

  revalidatePath('/finanzas/credits');
  revalidatePath('/finanzas/movimientos');
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
