import { createAdminClient } from '@/lib/supabase/admin';
import { sendToSubscriptions, type PushRow, type PushPayload } from '@/lib/push-server';

export type NotifModule = 'finanzas' | 'mentalidad' | 'familia' | 'metas';

/**
 * Envía una notificación instantánea a un usuario (a todos sus dispositivos),
 * respetando sus preferencias. Nunca lanza: si algo falla, solo lo registra.
 * Se usa en Server Actions para eventos en tiempo real (p. ej. asignar tarea).
 */
export async function notifyUser(
  userId: string,
  payload: PushPayload,
  module?: NotifModule
): Promise<void> {
  let db: ReturnType<typeof createAdminClient>;
  try {
    db = createAdminClient();
  } catch {
    return; // sin service role no podemos notificar en tiempo real
  }

  const { data: pref } = await db
    .from('notification_prefs')
    .select('enabled, finanzas, mentalidad, familia, metas')
    .eq('user_id', userId)
    .maybeSingle();

  if (!pref || !pref.enabled) return;
  if (module && !(pref as Record<string, boolean>)[module]) return;

  const { data } = await db
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  const subs = (data as PushRow[]) || [];
  if (subs.length === 0) return;

  try {
    const { expiredEndpoints } = await sendToSubscriptions(subs, payload);
    if (expiredEndpoints.length > 0) {
      await db.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
    }
  } catch (e) {
    console.error('notifyUser error:', e);
  }
}
