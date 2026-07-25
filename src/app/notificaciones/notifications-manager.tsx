'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Send, ShieldAlert, Share, Loader2 } from 'lucide-react';
import {
  savePushSubscription,
  removePushSubscription,
  sendTestNotification,
} from './actions';

type State = 'loading' | 'unsupported' | 'needs-install' | 'off' | 'on';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function NotificationsManager() {
  const [state, setState] = useState<State>('loading');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    (async () => {
      const supported =
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
      if (!supported) return setState('unsupported');

      // iOS solo permite push si la PWA está instalada (agregada al inicio).
      const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      if (iOS && !isStandalone()) return setState('needs-install');

      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setState(sub && Notification.permission === 'granted' ? 'on' : 'off');
      } catch {
        setState('off');
      }
    })();
  }, []);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      if (!vapidKey) {
        setMsg({ tone: 'err', text: 'Falta la clave pública VAPID en el servidor.' });
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setMsg({ tone: 'err', text: 'Permiso de notificaciones denegado.' });
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
      });
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const res = await savePushSubscription(
        { endpoint: json.endpoint, keys: json.keys },
        navigator.userAgent
      );
      if (res?.error) {
        setMsg({ tone: 'err', text: res.error });
        return;
      }
      setState('on');
      setMsg({ tone: 'ok', text: 'Notificaciones activadas en este dispositivo.' });
    } catch (err) {
      console.error(err);
      setMsg({ tone: 'err', text: 'No se pudo activar. Intenta de nuevo.' });
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setState('off');
      setMsg({ tone: 'ok', text: 'Notificaciones desactivadas en este dispositivo.' });
    } catch {
      setMsg({ tone: 'err', text: 'No se pudo desactivar.' });
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMsg(null);
    const res = await sendTestNotification();
    if (res?.error) setMsg({ tone: 'err', text: res.error });
    else setMsg({ tone: 'ok', text: 'Notificación de prueba enviada.' });
    setBusy(false);
  }

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Bell size={20} className="text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-tight">Notificaciones</h2>
          <p className="text-xs text-slate-500 font-medium">Avisos de tus 4 módulos en este dispositivo</p>
        </div>
      </div>

      {state === 'loading' && (
        <p className="text-sm text-slate-500 flex items-center gap-2">
          <Loader2 size={15} className="animate-spin" /> Comprobando…
        </p>
      )}

      {state === 'unsupported' && (
        <div className="flex items-start gap-3 text-sm text-slate-400 bg-black/30 border border-white/5 rounded-2xl p-4">
          <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <p>Este navegador no soporta notificaciones push.</p>
        </div>
      )}

      {state === 'needs-install' && (
        <div className="flex items-start gap-3 text-sm text-slate-300 bg-black/30 border border-white/5 rounded-2xl p-4">
          <Share size={18} className="text-indigo-400 shrink-0 mt-0.5" />
          <p>
            En iPhone primero <b>instala la app</b>: toca el botón <b>Compartir</b> y luego{' '}
            <b>&ldquo;Agregar a inicio&rdquo;</b>. Abre LifeHub desde el ícono y vuelve aquí para activar
            las notificaciones.
          </p>
        </div>
      )}

      {(state === 'off' || state === 'on') && (
        <div className="space-y-4">
          {state === 'on' ? (
            <button
              onClick={disable}
              disabled={busy}
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-slate-300 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <BellOff size={15} />}
              Desactivar en este dispositivo
            </button>
          ) : (
            <button
              onClick={enable}
              disabled={busy}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />}
              Activar notificaciones
            </button>
          )}

          {state === 'on' && (
            <button
              onClick={test}
              disabled={busy}
              className="inline-flex items-center gap-2 ml-0 sm:ml-3 text-slate-400 hover:text-white px-3 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              <Send size={14} /> Enviar prueba
            </button>
          )}
        </div>
      )}

      {msg && (
        <p className={`text-xs font-bold ${msg.tone === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
