import { randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MP_STATE_COOKIE, mpAuthorizeUrl, mpConfigured } from '@/lib/mercadopago';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Inicia la conexión con Mercado Pago con un `state` aleatorio (anti-CSRF). */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));
  if (!mpConfigured()) return NextResponse.redirect(new URL('/finanzas/conexiones?mp=error', request.url));

  const state = randomBytes(24).toString('hex');
  const res = NextResponse.redirect(mpAuthorizeUrl(state));
  res.cookies.set(MP_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/mp',
    maxAge: 600,
  });
  return res;
}
