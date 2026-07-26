import Link from 'next/link';
import { ArrowLeft, Wallet, Brain, Users, Target } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import NotificationsManager from './notifications-manager';
import { updateNotificationPrefs } from './actions';

export const dynamic = 'force-dynamic';

interface Prefs {
  enabled: boolean;
  finanzas: boolean;
  mentalidad: boolean;
  familia: boolean;
  metas: boolean;
}

const DEFAULT_PREFS: Prefs = {
  enabled: true,
  finanzas: true,
  mentalidad: true,
  familia: true,
  metas: true,
};

const MODULES = [
  { key: 'finanzas', label: 'Finanzas', desc: 'Pagos por confirmar del mes', icon: Wallet, color: 'text-emerald-400' },
  { key: 'mentalidad', label: 'Mentalidad', desc: 'Hábitos y tu 369 (La Forja)', icon: Brain, color: 'text-indigo-400' },
  { key: 'familia', label: 'Familia', desc: 'Tareas del hogar asignadas', icon: Users, color: 'text-orange-400' },
  { key: 'metas', label: 'Metas', desc: 'Objetivos que vencen pronto', icon: Target, color: 'text-amber-400' },
] as const;

export default async function NotificacionesPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from('notification_prefs')
    .select('enabled, finanzas, mentalidad, familia, metas')
    .eq('user_id', user.id)
    .maybeSingle();

  const prefs: Prefs = (data as Prefs) || DEFAULT_PREFS;

  return (
    <div className="min-h-screen bg-[#050608] text-white relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none z-0" />

      <header className="relative z-10 px-6 md:px-10 lg:px-16 py-6">
        <Link
          href="/hub"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-[0.15em] transition-colors"
        >
          <ArrowLeft size={16} /> Volver al inicio
        </Link>
      </header>

      <main className="relative z-10 px-6 md:px-10 lg:px-16 pb-20 max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter italic">
            Notificaciones<span className="text-indigo-500">.</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-sm">
            Activa los avisos y elige qué te recuerda LifeHub.
          </p>
        </div>

        <NotificationsManager />

        {/* Preferencias por módulo */}
        <form action={updateNotificationPrefs} className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl space-y-5">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">¿Qué quieres recibir?</h2>

          <label className="flex items-center justify-between gap-4 py-2 border-b border-white/5">
            <div>
              <p className="text-sm font-black text-white">Activar avisos</p>
              <p className="text-xs text-slate-500">Interruptor general de todas las notificaciones</p>
            </div>
            <input type="checkbox" name="enabled" defaultChecked={prefs.enabled} className="w-5 h-5 accent-indigo-500 shrink-0" />
          </label>

          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <label key={m.key} className="flex items-center justify-between gap-4 py-1.5">
                <div className="flex items-center gap-3">
                  <Icon size={18} className={m.color} />
                  <div>
                    <p className="text-sm font-bold text-slate-200">{m.label}</p>
                    <p className="text-xs text-slate-500">{m.desc}</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name={m.key}
                  defaultChecked={prefs[m.key]}
                  className="w-5 h-5 accent-indigo-500 shrink-0"
                />
              </label>
            );
          })}

          <button
            type="submit"
            className="w-full bg-white text-black py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-95"
          >
            Guardar preferencias
          </button>
        </form>

        <p className="text-[11px] text-slate-600 text-center leading-relaxed">
          Las notificaciones llegan una vez al día con lo pendiente de cada módulo.
          En iPhone requieren tener LifeHub instalado en la pantalla de inicio.
        </p>
      </main>
    </div>
  );
}
