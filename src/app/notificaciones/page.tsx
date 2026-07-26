import Link from 'next/link';
import { ArrowLeft, Wallet, Brain, Users, Target, Clock, Flame } from 'lucide-react';
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
  forja_time: string;
  m369_morning_time: string;
  m369_afternoon_time: string;
  m369_night_time: string;
  digest_time: string;
  low_balance_enabled: boolean;
  low_balance_threshold: number;
}

const DEFAULT_PREFS: Prefs = {
  enabled: true,
  finanzas: true,
  mentalidad: true,
  familia: true,
  metas: true,
  forja_time: '06:00',
  m369_morning_time: '09:00',
  m369_afternoon_time: '14:00',
  m369_night_time: '21:00',
  digest_time: '09:00',
  low_balance_enabled: false,
  low_balance_threshold: 0,
};

const MODULES = [
  { key: 'finanzas', label: 'Finanzas', desc: 'Pagos por confirmar + saldo bajo', icon: Wallet, color: 'text-emerald-400' },
  { key: 'mentalidad', label: 'Mentalidad', desc: 'La Forja, tu 369 y hábitos', icon: Brain, color: 'text-indigo-400' },
  { key: 'familia', label: 'Familia', desc: 'Tareas asignadas (aviso al instante)', icon: Users, color: 'text-orange-400' },
  { key: 'metas', label: 'Metas', desc: 'Objetivos que vencen pronto', icon: Target, color: 'text-amber-400' },
] as const;

const hhmm = (v: string | undefined, def: string) => (v ? v.slice(0, 5) : def);

const inputCls =
  'bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50';

export default async function NotificacionesPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from('notification_prefs')
    .select(
      'enabled, finanzas, mentalidad, familia, metas, forja_time, m369_morning_time, m369_afternoon_time, m369_night_time, digest_time, low_balance_enabled, low_balance_threshold'
    )
    .eq('user_id', user.id)
    .maybeSingle();

  const prefs: Prefs = (data as Prefs) || DEFAULT_PREFS;

  const times = [
    { name: 'forja_time', label: 'La Forja — frase del día', value: hhmm(prefs.forja_time, '06:00'), icon: Flame },
    { name: 'm369_morning_time', label: '369 · mañana (3×)', value: hhmm(prefs.m369_morning_time, '09:00'), icon: Clock },
    { name: 'm369_afternoon_time', label: '369 · tarde (6×)', value: hhmm(prefs.m369_afternoon_time, '14:00'), icon: Clock },
    { name: 'm369_night_time', label: '369 · noche (9×)', value: hhmm(prefs.m369_night_time, '21:00'), icon: Clock },
    { name: 'digest_time', label: 'Resumen de pendientes', value: hhmm(prefs.digest_time, '09:00'), icon: Clock },
  ];

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
            Activa los avisos, elige qué recibir y a qué hora.
          </p>
        </div>

        <NotificationsManager />

        <form action={updateNotificationPrefs} className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl space-y-6">
          {/* Módulos */}
          <div className="space-y-4">
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
                  <input type="checkbox" name={m.key} defaultChecked={prefs[m.key]} className="w-5 h-5 accent-indigo-500 shrink-0" />
                </label>
              );
            })}
          </div>

          {/* Horarios */}
          <div className="space-y-3 pt-5 border-t border-white/5">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Horarios</h2>
            <p className="text-[11px] text-slate-500">Aproximados (±30 min). Cada aviso llega una vez al día.</p>
            {times.map((t) => {
              const Icon = t.icon;
              return (
                <label key={t.name} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-sm text-slate-300">
                    <Icon size={14} className="text-indigo-400" /> {t.label}
                  </span>
                  <input type="time" name={t.name} defaultValue={t.value} className={inputCls} />
                </label>
              );
            })}
          </div>

          {/* Saldo bajo */}
          <div className="space-y-3 pt-5 border-t border-white/5">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Alerta de saldo bajo</h2>
            <label className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-200">Avísame si me queda poco</p>
                <p className="text-xs text-slate-500">Cuando el saldo del mes baje del umbral</p>
              </div>
              <input type="checkbox" name="low_balance_enabled" defaultChecked={prefs.low_balance_enabled} className="w-5 h-5 accent-indigo-500 shrink-0" />
            </label>
            <label className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-300">Umbral (CLP)</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-sm font-mono">$</span>
                <input
                  type="number"
                  name="low_balance_threshold"
                  min="0"
                  step="any"
                  defaultValue={prefs.low_balance_threshold || ''}
                  placeholder="50000"
                  className={`${inputCls} w-32`}
                />
              </div>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-95"
          >
            Guardar preferencias
          </button>
        </form>

        <p className="text-[11px] text-slate-600 text-center leading-relaxed">
          La asignación de tareas llega al instante. El resto se envía a la hora que elijas.
          En iPhone requiere tener LifeHub instalado en la pantalla de inicio.
        </p>
      </main>
    </div>
  );
}
