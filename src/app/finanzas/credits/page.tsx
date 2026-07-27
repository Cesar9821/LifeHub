import { createClient } from '@/lib/supabase/server';
import { CreditCard, Calendar, ArrowDownCircle, PieChart, ShieldAlert, TrendingDown, Trash2, Target } from 'lucide-react';
import CreditForm from './credit-form';
import { deleteCredit } from './actions';
import CreditPayment from './credit-payment';

export default async function CreditsPage() {
  const supabase = await createClient();

  const { data: credits } = await supabase
    .from('credits')
    .select('*')
    .order('created_at', { ascending: false });

  const totalDebt = credits?.reduce((acc, curr) => acc + Number(curr.remaining_amount), 0) || 0;
  const totalMonthly = credits?.reduce((acc, curr) => acc + Number(curr.installment_value), 0) || 0;

  // Estrategia bola de nieve: ataca primero la deuda más chica.
  const snowball = (credits || [])
    .filter((c) => Number(c.remaining_amount) > 0)
    .sort((a, b) => Number(a.remaining_amount) - Number(b.remaining_amount))[0];

  const inputStyles = "bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all backdrop-blur-md w-full appearance-none";

  return (
    <div className="space-y-8 md:space-y-12 pb-20">

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-md w-fit">
            <CreditCard size={14} className="text-rose-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Gestión de Pasivos</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter italic leading-none">
            Créditos<span className="text-rose-600">.</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] max-w-md">
            Control de apalancamiento y amortización de deuda
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-rose-500/5 border border-rose-500/10 p-5 md:px-8 rounded-[2rem] backdrop-blur-xl flex items-center gap-4 group hover:border-rose-500/30 transition-all">
            <div className="p-3 bg-rose-500 rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.2)] group-hover:scale-110 transition-transform">
              <TrendingDown size={20} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-black text-rose-500/60 uppercase tracking-[0.2em] mb-1">Deuda Total</p>
              <p className="text-2xl font-black text-white font-mono leading-none">
                ${totalDebt.toLocaleString('es-CL')}
              </p>
            </div>
          </div>
          <div className="bg-slate-800/30 border border-white/5 p-5 md:px-8 rounded-[2rem] backdrop-blur-xl">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Cuotas / Mes</p>
            <p className="text-2xl font-black text-slate-300 font-mono leading-none">
              ${totalMonthly.toLocaleString('es-CL')}
            </p>
          </div>
        </div>
      </div>

      {/* FORMULARIO */}
      <section className="relative z-10">
        <div className="bg-slate-900/40 border border-white/5 p-6 md:p-8 rounded-[2.5rem] backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-8">
            <ShieldAlert size={18} className="text-rose-500" />
            <h2 className="text-white font-black text-lg uppercase tracking-tighter">Registrar Nueva Obligación</h2>
          </div>
          <CreditForm inputStyles={inputStyles} />
        </div>
      </section>

      {/* ESTRATEGIA BOLA DE NIEVE */}
      {snowball && (
        <div className="bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 rounded-[2rem] p-6 flex items-start gap-3">
          <Target size={20} className="text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-white uppercase tracking-tight">Estrategia bola de nieve</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Ataca primero <b className="text-rose-300">{snowball.name}</b> (${Number(snowball.remaining_amount).toLocaleString('es-CL')}), la deuda más chica. Al liquidarla, suma su cuota a la siguiente y acelera. El impulso es real.
            </p>
          </div>
        </div>
      )}

      {/* GRID DE CRÉDITOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {credits && credits.length > 0 ? (
          credits.map((item) => {
            const vCuota = Number(item.installment_value) || 0;
            const pCuotas = Number(item.paid_installments) || 0;
            const tCuotas = Number(item.total_installments) || 1;
            const saldoRestante = Number(item.remaining_amount) || 0;
            const totalCTC = Number(item.total_amount) || 0;
            const progress = Math.min(100, (pCuotas / tCuotas) * 100);
            const cuotasRestantes = tCuotas - pCuotas;

            return (
              <div key={item.id} className="group p-5 md:p-8 bg-[#0A0C10] border border-white/5 rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden transition-all hover:border-rose-500/20 flex flex-col justify-between">
                <div className="absolute -right-20 -top-20 w-48 h-48 bg-rose-500/5 blur-[70px] group-hover:bg-rose-500/10 transition-all duration-700" />

                <div className="relative z-10 mb-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl md:text-2xl font-black text-white italic tracking-tight uppercase truncate leading-tight">
                        {item.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                          <Calendar size={10} className="text-rose-500" /> {pCuotas} / {tCuotas} cuotas
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/5 px-2.5 py-1 rounded-full border border-rose-500/10">
                          <PieChart size={10} /> {progress.toFixed(0)}% pagado
                        </div>
                        {cuotasRestantes > 0 && (
                          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-800/50 px-2.5 py-1 rounded-full border border-white/5">
                            {cuotasRestantes} cuota{cuotasRestantes !== 1 ? 's' : ''} restante{cuotasRestantes !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Cuota</span>
                        <p className="text-lg font-mono font-black text-white">${vCuota.toLocaleString('es-CL')}</p>
                      </div>
                      <form action={async () => {
                        'use server';
                        await deleteCredit(item.id);
                      }}>
                        <button type="submit" className="p-2.5 rounded-xl text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                  <div className="p-4 rounded-[1.5rem] bg-slate-950 border border-white/5">
                    <span className="text-[8px] font-black text-slate-600 uppercase block mb-1 tracking-widest">CTC Total</span>
                    <span className="text-base font-mono font-black text-slate-400 block truncate">
                      ${totalCTC.toLocaleString('es-CL')}
                    </span>
                  </div>
                  <div className="p-4 rounded-[1.5rem] bg-rose-950/20 border border-rose-500/20">
                    <span className="text-[8px] font-black text-rose-500 uppercase block mb-1 tracking-widest">Saldo Pendiente</span>
                    <span className="text-base font-mono font-black text-rose-400 block truncate">
                      ${saldoRestante.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 relative z-10">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Amortización</span>
                    <span className="text-xs font-mono font-black text-rose-400">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="relative w-full h-4 bg-slate-900 rounded-full border border-white/5 overflow-hidden p-[2px]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-800 via-rose-600 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all duration-1000 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/5">
                    <CreditPayment
                      id={item.id}
                      installmentValue={vCuota}
                      isFinished={pCuotas >= tCuotas}
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-12 md:p-24 text-center border-2 border-dashed border-slate-800 rounded-[2rem] md:rounded-[3.5rem] bg-slate-950/20">
            <div className="inline-flex p-4 md:p-6 bg-slate-900 rounded-full text-slate-700 mb-6 border border-white/5">
              <ArrowDownCircle size={32} className="opacity-20" />
            </div>
            <p className="text-slate-500 italic font-black uppercase tracking-[0.2em] text-xs md:text-sm">
              Libre de pasivos detectados
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
