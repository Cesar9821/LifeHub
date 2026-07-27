'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser, getActiveHouseholdId } from '@/lib/auth';
import { failIf } from '@/lib/errors';
import { mpFetchPayments } from '@/lib/mercadopago';
import { periodOf } from '@/services/movements';
import { revalidatePath } from 'next/cache';

/** Desconecta Mercado Pago (borra los tokens). */
export async function disconnectMercadoPago() {
  const supabase = await createClient();
  const user = await requireUser();
  const { error } = await supabase.from('mp_connections').delete().eq('user_id', user.id);
  failIf(error, 'No se pudo desconectar');
  revalidatePath('/finanzas/conexiones');
}

/** Trae los últimos pagos de Mercado Pago y los inserta como movimientos (sin duplicar). */
export async function syncMercadoPago() {
  const supabase = await createClient();
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();

  const { data: conn } = await supabase
    .from('mp_connections')
    .select('access_token')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!conn?.access_token) return;

  const payments = (await mpFetchPayments(conn.access_token)).filter((p) => p.status === 'approved');
  if (payments.length === 0) {
    revalidatePath('/finanzas/conexiones');
    return;
  }

  const externalIds = payments.map((p) => `mp:${p.id}`);
  const { data: existing } = await supabase
    .from('movements')
    .select('external_id')
    .eq('household_id', householdId)
    .in('external_id', externalIds);
  const already = new Set((existing || []).map((e) => e.external_id as string));

  const rows = payments
    .filter((p) => !already.has(`mp:${p.id}`))
    .map((p) => ({
      household_id: householdId,
      created_by: user.id,
      recurring_id: null,
      external_id: `mp:${p.id}`,
      description: `MP: ${p.description || 'Pago'} (#${p.id})`,
      kind: 'income',
      category: 'Mercado Pago',
      estimated_amount: p.transaction_amount,
      actual_amount: p.transaction_amount,
      status: 'confirmed',
      confirmed_at: p.date_created,
      due_date: p.date_created.slice(0, 10),
      period_month: periodOf(new Date(p.date_created)),
    }));

  if (rows.length > 0) {
    const { error } = await supabase.from('movements').insert(rows);
    failIf(error, 'No se pudo sincronizar');
  }

  revalidatePath('/finanzas/conexiones');
  revalidatePath('/finanzas/movimientos');
}
