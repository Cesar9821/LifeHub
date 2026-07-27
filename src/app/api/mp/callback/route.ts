import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mpExchangeCode } from '@/lib/mercadopago';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const redirect = (status: string) => {
    const url = new URL('/finanzas/conexiones', request.url);
    url.searchParams.set('mp', status);
    return NextResponse.redirect(url);
  };

  const code = request.nextUrl.searchParams.get('code');
  if (!code) return redirect('error');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));

  try {
    const tokens = await mpExchangeCode(code);
    if (!tokens.access_token) return redirect('error');

    await supabase.from('mp_connections').upsert(
      {
        user_id: user.id,
        mp_user_id: String(tokens.user_id ?? ''),
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    return redirect('ok');
  } catch (e) {
    console.error('MP callback:', e);
    return redirect('error');
  }
}
