import Link from 'next/link';
import { ArrowRight, Activity, Lock } from 'lucide-react';
import { MODULES } from './hub/modules';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-ink relative overflow-hidden font-sans">
      {/* Luces ambientales */}
      <div className="absolute top-[-10%] left-[-8%] w-[45%] h-[45%] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-8%] w-[45%] h-[45%] bg-emerald-600/8 rounded-full blur-[130px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-24">
        {/* Encabezado */}
        <div className="flex flex-col items-center text-center mb-16 md:mb-20">
          <div className="mb-8 px-4 py-1.5 rounded-full border border-line-strong bg-surface flex items-center gap-2">
            <Activity size={14} className="text-emerald-400" />
            <span className="text-xs font-bold text-ink-2 tracking-wide">
              Tu sistema personal
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-semibold text-ink tracking-tight leading-none">
            Life<span className="text-indigo-500">Hub</span>
          </h1>

          <p className="text-ink-2 font-medium mt-6 max-w-lg text-lg">
            Un solo lugar para tu dinero, tus hábitos, tu familia y tu bienestar.
            Todo tu hogar, organizado.
          </p>

          <Link
            href="/hub"
            className="mt-10 bg-white text-black px-10 py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-slate-200 transition-all active:scale-95 shadow-[0_10px_30px_-10px_rgba(255,255,255,0.3)]"
          >
            ENTRAR <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Vitrina de módulos */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const isActive = mod.status === 'active';
            return (
              <div
                key={mod.id}
                className={`
                  relative bg-surface border border-line rounded-3xl p-6 backdrop-blur-xl
                  ${isActive ? '' : 'opacity-50'}
                `}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-black/40 border border-line-strong flex items-center justify-center">
                    <Icon className={mod.accent.text} size={22} />
                  </div>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-semibold text-emerald-400 tracking-wide">
                        Activo
                      </span>
                    </span>
                  ) : (
                    <Lock size={12} className="text-ink-3 mt-1" />
                  )}
                </div>
                <h2 className="text-lg font-semibold text-ink tracking-tight">
                  {mod.name}
                </h2>
                <p className="text-xs text-ink-3 font-medium mt-1">
                  {mod.tagline}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="relative z-10 text-center pb-10 text-ink-3 text-xs font-bold tracking-wide">
        LifeHub © 2026
      </footer>
    </div>
  );
}
