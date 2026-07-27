import { RefreshCw, Unlink, CheckCircle2, AlertTriangle, Link2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { mpAuthorizeUrl, mpConfigured } from '@/lib/mercadopago';
import { syncMercadoPago, disconnectMercadoPago } from './actions';

export const dynamic = 'force-dynamic';

export default async function ConexionesPage({
  searchParams,
}: {
  searchParams: Promise<{ mp?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: conn } = await supabase
    .from('mp_connections')
    .select('mp_user_id, connected_at')
    .eq('user_id', user.id)
    .maybeSingle();

  const configured = mpConfigured();
  const authorizeUrl = mpAuthorizeUrl();

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/5 w-fit">
          <Link2 size={12} className="text-sky-400" />
          <span className="text-[9px] md:text-[10px] font-bold text-sky-400/80 uppercase tracking-[0.2em]">Integraciones</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic">
          Conexiones<span className="text-sky-500">.</span>
        </h1>
      </div>

      {params.mp === 'ok' && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl px-4 py-3 text-sm font-bold text-emerald-300">
          <CheckCircle2 size={16} /> Mercado Pago conectado.
        </div>
      )}
      {params.mp === 'error' && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 rounded-2xl px-4 py-3 text-sm font-bold text-rose-300">
          <AlertTriangle size={16} /> No se pudo conectar. Revisa la configuración.
        </div>
      )}

      <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Link2 size={20} className="text-sky-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Mercado Pago</h2>
            <p className="text-xs text-slate-500 font-medium">Importa tus movimientos automáticamente</p>
          </div>
        </div>

        {!configured ? (
          <div className="flex items-start gap-3 text-sm text-slate-400 bg-black/30 border border-white/5 rounded-2xl p-4">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <p>
              Falta configurar la app de Mercado Pago en el servidor (<code className="text-slate-300">MP_CLIENT_ID</code>,{' '}
              <code className="text-slate-300">MP_CLIENT_SECRET</code>, <code className="text-slate-300">MP_REDIRECT_URI</code>).
              Ver <b>MERCADOPAGO.md</b>.
            </p>
          </div>
        ) : conn ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
              <CheckCircle2 size={16} /> Conectado
              {conn.connected_at && (
                <span className="text-slate-500 font-medium">
                  · desde {new Date(conn.connected_at).toLocaleDateString('es-CL')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <form action={syncMercadoPago}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95"
                >
                  <RefreshCw size={15} /> Sincronizar ahora
                </button>
              </form>
              <form action={disconnectMercadoPago}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 text-slate-400 hover:text-rose-400 px-3 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors"
                >
                  <Unlink size={15} /> Desconectar
                </button>
              </form>
            </div>
          </div>
        ) : (
          <a
            href={authorizeUrl}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95"
          >
            <Link2 size={15} /> Conectar Mercado Pago
          </a>
        )}

        <p className="text-[11px] text-slate-600 leading-relaxed">
          Autorizas en el sitio de Mercado Pago (nunca ingresas tus claves aquí). LifeHub lee tus
          pagos y los agrega como movimientos, sin duplicar.
        </p>
      </div>
    </div>
  );
}
