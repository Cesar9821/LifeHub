'use server'

import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId, requireUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function addTransaction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();

  const description = formData.get('description') as string;
  const type = formData.get('type') as string;
  const category = (formData.get('category') as string) || 'General';
  const destination = (formData.get('destination') as string) || 'normal';
  const saving_id = formData.get('saving_id') as string || null;
  const credit_id = formData.get('credit_id') as string || null;

  const amountRaw = formData.get('amount');
  let amount = amountRaw ? parseFloat(amountRaw as string) : 0;
  if (isNaN(amount) || amount === 0) return;

  amount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);

  const { error: txError } = await supabase
    .from('transactions')
    .insert([{
        household_id: householdId,
        created_by: user.id,
        description,
        amount,
        type,
        category,
        destination,
        saving_id: (destination === 'saving' || destination === 'withdraw_saving') ? saving_id : null,
        credit_id: destination === 'credit' ? credit_id : null,
    }]);

  if (txError) throw new Error(`Error en DB: ${txError.message}`);

  // BUG FIX: Actualizar credito con logica correcta basada en saldo real
  if (destination === 'credit' && credit_id) {
    const { data: credit } = await supabase
      .from('credits')
      .select('remaining_amount, paid_installments, installment_value, total_installments')
      .eq('id', credit_id)
      .single();

    if (credit) {
      const paymentAmount = Math.abs(amount);
      const currentRemaining = Number(credit.remaining_amount) || 0;
      const vCuota = Number(credit.installment_value) || 0;
      const totalInst = Number(credit.total_installments) || 1;

      const newRemaining = Math.max(0, currentRemaining - paymentAmount);

      // Calcular cuotas pagadas basado en saldo consumido (no en numero de pagos)
      const newPaidInstallments = vCuota > 0
        ? Math.min(totalInst, Math.round((totalInst * vCuota - newRemaining) / vCuota))
        : Number(credit.paid_installments) || 0;

      if (newRemaining <= 0) {
        await supabase.from('credits').delete().eq('id', credit_id);
      } else {
        await supabase
          .from('credits')
          .update({
            paid_installments: newPaidInstallments,
            remaining_amount: newRemaining,
          })
          .eq('id', credit_id);
      }
    }
  }

  if ((destination === 'saving' || destination === 'withdraw_saving') && saving_id) {
    const { data: saving } = await supabase
      .from('savings')
      .select('current_amount')
      .eq('id', saving_id)
      .single();

    if (saving) {
      const currentSaving = Number(saving.current_amount) || 0;
      const txAmount = Math.abs(amount);
      const newAmount = destination === 'withdraw_saving'
        ? currentSaving - txAmount
        : currentSaving + txAmount;

      await supabase
        .from('savings')
        .update({ current_amount: Math.max(0, newAmount) })
        .eq('id', saving_id);
    }
  }

  revalidatePath('/finanzas/transactions');
  revalidatePath('/finanzas/credits');
  revalidatePath('/finanzas/savings');
  revalidatePath('/finanzas/dashboard');
  revalidatePath('/finanzas/performance');
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: tx } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single();

  if (!tx) return;

  const absAmount = Math.abs(tx.amount);

  if (tx.destination === 'credit' && tx.credit_id) {
    const { data: credit } = await supabase
      .from('credits')
      .select('remaining_amount, paid_installments, installment_value, total_installments')
      .eq('id', tx.credit_id)
      .single();

    if (credit) {
      const vCuota = Number(credit.installment_value) || 0;
      const totalInst = Number(credit.total_installments) || 1;
      const restoredBalance = Number(credit.remaining_amount) + absAmount;

      const newPaidInstallments = vCuota > 0
        ? Math.max(0, Math.round((totalInst * vCuota - restoredBalance) / vCuota))
        : Math.max(0, (credit.paid_installments || 0) - 1);

      await supabase
        .from('credits')
        .update({
          remaining_amount: restoredBalance,
          paid_installments: newPaidInstallments,
        })
        .eq('id', tx.credit_id);
    }
  }

  if ((tx.destination === 'saving' || tx.destination === 'withdraw_saving') && tx.saving_id) {
    const { data: saving } = await supabase
      .from('savings')
      .select('current_amount')
      .eq('id', tx.saving_id)
      .single();

    if (saving) {
      const currentSaving = Number(saving.current_amount) || 0;
      const restoredAmount = tx.destination === 'withdraw_saving'
        ? currentSaving + absAmount
        : currentSaving - absAmount;

      await supabase
        .from('savings')
        .update({ current_amount: Math.max(0, restoredAmount) })
        .eq('id', tx.saving_id);
    }
  }

  await supabase.from('transactions').delete().eq('id', id);

  revalidatePath('/finanzas/transactions');
  revalidatePath('/finanzas/dashboard');
  revalidatePath('/finanzas/savings');
  revalidatePath('/finanzas/credits');
  revalidatePath('/finanzas/performance');
}
