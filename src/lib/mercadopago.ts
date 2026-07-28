/**
 * Helpers de Mercado Pago (OAuth 2.0 + lectura de pagos).
 * Requiere las variables MP_CLIENT_ID, MP_CLIENT_SECRET y MP_REDIRECT_URI.
 * Nota: la API pública de MP está orientada a *pagos recibidos* (vendedor);
 * ahí es donde `/v1/payments/search` devuelve tus movimientos de cobro.
 */

export function mpConfigured(): boolean {
  return Boolean(process.env.MP_CLIENT_ID && process.env.MP_CLIENT_SECRET && process.env.MP_REDIRECT_URI);
}

/** URL a la que se envía al usuario para que autorice la conexión. */
export function mpAuthorizeUrl(): string {
  const clientId = process.env.MP_CLIENT_ID || '';
  const redirect = process.env.MP_REDIRECT_URI || '';
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    platform_id: 'mp',
    redirect_uri: redirect,
  });
  return `https://auth.mercadopago.cl/authorization?${params.toString()}`;
}

interface MpTokens {
  access_token?: string;
  refresh_token?: string;
  user_id?: number | string;
  expires_in?: number;
}

/** Intercambia el `code` del callback por tokens. */
export async function mpExchangeCode(code: string): Promise<MpTokens> {
  const res = await fetch('https://api.mercadopago.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.MP_CLIENT_ID,
      client_secret: process.env.MP_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.MP_REDIRECT_URI,
    }),
  });
  return (await res.json()) as MpTokens;
}

export interface MpPayment {
  id: number;
  description: string | null;
  transaction_amount: number;
  date_created: string;
  status: string;
  /** Quién recibió el pago (si coincide con tu cuenta = ingreso). */
  collector_id?: number | string;
  operation_type?: string;
}

/** Últimos pagos (cobros) de la cuenta conectada. */
export async function mpFetchPayments(accessToken: string): Promise<MpPayment[]> {
  const res = await fetch(
    'https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=25',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: MpPayment[] };
  return data.results || [];
}
