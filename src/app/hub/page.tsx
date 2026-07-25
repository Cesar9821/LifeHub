import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { MODULES } from './modules';

export default function HubPage() {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="max-w-6xl mx-auto pt-6 md:pt-10">
      {/* Encabezado */}
      <div className="mb-12 md:mb-16">
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-3">
          Tu sistema personal
        </p>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-none">
          {greeting}.
        </h1>
        <p className="text-slate-500 font-medium mt-4 max-w-md">
          Elige un módulo para empezar. Todo tu hogar, en un solo lugar.
        </p>
      </div>

      {/* Grid de módulos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const isActive = mod.status === 'active';

          const card = (
            <div
              className={`
                group relative h-full bg-slate-900/40 border border-white/5 rounded-[2rem] p-7 backdrop-blur-xl
                transition-all duration-300
                ${isActive ? `cursor-pointer hover:-translate-y-1 ${mod.accent.glow} ${mod.accent.border}` : 'opacity-60'}
              `}
            >
              {/* Estado */}
              <div className="flex items-start justify-between mb-8">
                <div className="h-14 w-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center">
                  <Icon className={mod.accent.text} size={26} />
                </div>
                {isActive ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                      Activo
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5">
                    <Lock size={10} className="text-slate-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      Pronto
                    </span>
                  </div>
                )}
              </div>

              {/* Texto */}
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${mod.accent.text}`}>
                {mod.tagline}
              </p>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                {mod.name}
              </h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {mod.description}
              </p>

              {/* Flecha de entrada */}
              {isActive && (
                <div className="mt-6 flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest">
                  Entrar
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </div>
              )}
            </div>
          );

          return isActive ? (
            <Link key={mod.id} href={mod.href} className="block h-full">
              {card}
            </Link>
          ) : (
            <div key={mod.id} className="h-full" aria-disabled="true">
              {card}
            </div>
          );
        })}
      </div>
    </div>
  );
}
