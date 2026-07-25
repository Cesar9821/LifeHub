import webpush from 'web-push';

let configured = false;

/** Configura VAPID una sola vez (lazy, para no romper el build sin claves). */
function ensureConfigured(): boolean {
  if (configured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:soporte@lifehub.app';

  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export interface PushRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface SendResult {
  sent: number;
  /** endpoints inválidos (410/404) que conviene borrar */
  expiredEndpoints: string[];
}

/**
 * Envía un payload a un conjunto de suscripciones. Nunca lanza: acumula los
 * endpoints caducados para que el llamador los limpie.
 */
export async function sendToSubscriptions(
  subs: PushRow[],
  payload: PushPayload
): Promise<SendResult> {
  if (!ensureConfigured()) {
    throw new Error('Web Push no configurado: faltan las claves VAPID.');
  }

  const data = JSON.stringify(payload);
  const expiredEndpoints: string[] = [];
  let sent = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          expiredEndpoints.push(s.endpoint);
        } else {
          console.error('Error enviando push:', err);
        }
      }
    })
  );

  return { sent, expiredEndpoints };
}

export function isPushConfigured(): boolean {
  return ensureConfigured();
}
