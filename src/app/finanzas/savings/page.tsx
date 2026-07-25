import { createClient } from '@/lib/supabase/server';
import { Target, TrendingUp, Sparkles, Box, Trash2 } from 'lucide-react';
import SavingForm from './saving-form';
import { deleteSaving } from './actions';
import SavingDeposit from './saving-deposit';

export default async function SavingsPage() {
  const supabase = await createClient();

  const { data: savings } = await supabase
    .from('savings')
    .select('*')
    .order('created_at', { ascending: false });

  const totalSavings = savings?.reduce((acc, curr) => acc + Number(curr.current_amount), 0) || 0;
  const totalTarget = savings?.reduce((acc, curr) => acc + Number(curr.target_amount), 0) || 0;

  const inputStyles = "bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all backdrop-blur-md w-full appearance-none";

  return (
    <div className="space-y-8 md:space-y-12 pb-20">

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-md w-fit">
            <Target size={14} className="text-amber-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Protocolos de Reserva</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter italic leading-none">
            Ahorros<span className="text-amber-500">.</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] max-w-md">
            Gestión estratégica de activos y fondos de emergencia
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-amber-500/5 border border-amber-500/10 p-5 md:px-8 rounded-[2rem] backdrop-blur-xl flex items-center gap-4 group hover:border-amber-500/30 transition-all">
            <div className="p-3 bg-amber-500 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] group-hover:scale-110 transition-transform">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-[0.2em] mb-1">Ahorrado</p>
              <p className="text-2xl font-black text-white font-mono leading-none">
                ${totalSavings.toLocaleString('es-CL')}
              </p>
            </div>
          </div>
          <div className="bg-slate-800/30 border border-white/5 p-5 md:px-8 rounded-[2rem] backdrop-blur-xl flex items-center gap-4">
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Objetivo Total</p>
              <p className="text-2xl font-black text-slate-300 font-mono leading-none">
                ${totalTarget.toLocaleString('es-CL')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FORMULARIO */}
      <section className="relative z-10">
        <div className="bg-slate-900/40 border border-white/5 p-6 md:p-8 rounded-[2.5rem] backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <Box size={18} className="text-amber-500" />
            <h2 className="text-white font-black text-lg uppercase tracking-tighter">Configurar Nueva Meta</h2>
          </div>
          <SavingForm inputStyles={inputStyles} />
        </div>
      </section>

      {/* GRID DE METAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {savings && savings.length > 0 ? (
          savings.map((item) => {
            const progress = Math.min((item.current_amount / item.target_amount) * 100, 100);
            const remaining = Math.max(0, item.target_amount - item.current_amount);

            return (
              <div key={item.id} className="group p-8 bg-[#0A0C10] border border-white/5 rounded-[3rem] shadow-2xl hover:border-amber-500/20 transition-all duration-500 relative overflow-hidden flex flex-col justify-between h-full">

                <div className="absolute -right-16 -top-16 w-44 h-44 bg-amber-500/5 blur-[60px] group-hover:bg-amber-500/10 transition-all duration-700" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-black text-white italic tracking-tight group-hover:text-amber-400 transition-colors truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Activo</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 group-hover:rotate-12 transition-transform">
                        <TrendingUp size={18} className="text-amber-500" />
                      </div>
                      <form action={async () => {
                        'use server';
                        await deleteSaving(item.id);
                      }}>
                        <button type="submit" className="p-2.5 rounded-xl text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Balance en Bóveda</span>
                      <div className="text-4xl font-mono font-black text-white mt-1">
                        ${new Intl.NumberFormat('es-CL').format(item.current_amount)}
                      </div>
                    </div>

                    <div className="flex justify-between items-end border-t border-white/5 pt-4">
                      <div>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Progreso</span>
                        <p className="text-xl font-black text-amber-500 italic">{progress.toFixed(1)}%</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Faltan</span>
                        <p className="text-sm font-bold text-slate-400 font-mono">
                          ${remaining.toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="relative w-full h-4 bg-slate-900 rounded-full overflow-hidden border border-white/5 p-[2px]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200 transition-all duration-[1500ms] ease-out shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-slate-600">
                        <span>$0</span>
                        <span>${item.target_amount.toLocaleString('es-CL')}</span>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/5">
                      <SavingDeposit id={item.id} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-24 text-center border-2 border-dashed border-slate-800 rounded-[3.5rem] bg-slate-950/20">
            <div className="inline-flex p-6 bg-slate-900 rounded-full text-slate-700 mb-6">
              <Target size={48} className="opacity-20" />
            </div>
            <p className="text-slate-600 italic font-bold uppercase tracking-[0.3em] text-sm">
              Sin protocolos de acumulación detectados
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
