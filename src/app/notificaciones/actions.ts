'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { failIf } from '@/lib/errors';
import { sendToSubscriptions } from '@/lib/push-server';
import { revalidatePath } from 'next/cache';

export interface BrowserSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Guarda (o actualiza) la suscripción push del navegador actual. */
export async function savePushSubscription(
  sub: BrowserSubscription,
  userAgent?: string
) {
  const supabase = await createClient();
  const user = await requireUser();

  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return { error: 'Suscripción inválida.' };
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: userAgent || null,
    },
    { onConflict: 'endpoint' }
  );

  if (error) {
    console.error('Error guardando suscripción push:', error.message);
    return { error: 'No se pudo activar las notificaciones.' };
  }

  // Asegura una fila de preferencias (por defecto todo activado).
  await supabase
    .from('notification_prefs')
    .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });

  revalidatePath('/notificaciones');
  return { ok: true };
}

/** Elimina la suscripción de este navegador (al desactivar). */
export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient();
  const user = await requireUser();
  if (!endpoint) return;

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);

  failIf(error, 'No se pudo desactivar las notificaciones');
  revalidatePath('/notificaciones');
}

/** Actualiza qué módulos notifican. */
export async function updateNotificationPrefs(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser();

  const bool = (k: string) => formData.get(k) === 'on';

  const { error } = await supabase.from('notification_prefs').upsert(
    {
      user_id: user.id,
      enabled: bool('enabled'),
      finanzas: bool('finanzas'),
      mentalidad: bool('mentalidad'),
      familia: bool('familia'),
      metas: bool('metas'),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  failIf(error, 'No se pudieron guardar las preferencias');
  revalidatePath('/notificaciones');
}

/** Envía una notificación de prueba a los dispositivos del usuario actual. */
export async function sendTestNotification() {
  const supabase = await createClient();
  const user = await requireUser();

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', user.id);

  if (!subs || subs.length === 0) {
    return { error: 'No hay dispositivos suscritos todavía.' };
  }

  try {
    const { sent, expiredEndpoints } = await sendToSubscriptions(subs, {
      title: 'LifeHub ✅',
      body: 'Las notificaciones están funcionando. ¡A por tus metas!',
      url: '/hub',
      tag: 'test',
    });

    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }

    if (sent === 0) return { error: 'No se pudo entregar en ningún dispositivo.' };
    return { ok: true, sent };
  } catch (err) {
    console.error('Error en notificación de prueba:', err);
    return {
      error:
        'Falta configurar las claves VAPID en el servidor (variables de entorno).',
    };
  }
}
