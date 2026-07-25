import { getPerformanceData } from './actions'
import { normalizePeriod, periodLabel, isCurrentPeriod } from '@/services/movements'
import MonthSelector from '../movimientos/month-selector'
import { ArrowUpRight, Activity, Target, Zap, ShieldCheck, AlertCircle, Wallet, Lightbulb, TrendingUp } from 'lucide-react'

const formatFull = (n: number) => 
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const formatCompact = (n: number) => 
  new Intl.NumberFormat('es-CL', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const params = await searchParams
  const period = normalizePeriod(params?.mes)
  const data = await getPerformanceData(period)
  
  if (!data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Activity className="animate-spin text-indigo-500" size={40} />
        <div className="font-mono text-slate-500 italic text-xs tracking-[0.3em] uppercase">
          Sincronizando Núcleo de Análisis...
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* HEADER DE ALTA FIDELIDAD */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-slate-500 font-mono text-[10px] tracking-[0.4em] uppercase">{isCurrentPeriod(period) ? 'Motor de Estrategia en Vivo' : periodLabel(period)}</p>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-none text-white">
            Análisis<span className="text-indigo-600">.</span>
          </h1>
          <div className="pt-4">
            <MonthSelector period={period} basePath="/finanzas/performance" />
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-[2.5rem] backdrop-blur-xl w-full md:w-auto md:min-w-[280px]">
          <div className="flex items-center gap-2 mb-2">
             <Wallet size={14} className="text-slate-500" />
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Patrimonio Neto</p>
          </div>
          <p className={`text-4xl font-black font-mono tracking-tighter ${data.metrics.patrimonio >= 0 ? 'text-white' : 'text-rose-500'}`}>
            {formatFull(data.metrics.patrimonio)}
          </p>
        </div>
      </header>

      {/* SECCIÓN DE INSIGHTS (INTELIGENCIA ESTRATÉGICA) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.insights.map((insight: any) => (
          <div key={insight.id} className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] hover:bg-slate-900/60 transition-all group relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
               {insight.id === 'saving' && <Target size={100} />}
               {insight.id === 'debt' && <Zap size={100} />}
               {insight.id === 'runway' && <ShieldCheck size={100} />}
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform border border-indigo-500/20">
                {insight.id === 'saving' && <Target size={20} />}
                {insight.id === 'debt' && <Zap size={20} />}
                {insight.id === 'runway' && <ShieldCheck size={20} />}
              </div>
              <Lightbulb size={16} className="text-slate-700" />
            </div>
            
            <h4 className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-500 mb-2">{insight.title}</h4>
            <p className="text-white text-lg font-bold leading-tight mb-6 italic group-hover:text-indigo-400 transition-colors">"{insight.desc}"</p>
            
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
              <p className="text-[9px] font-black text-indigo-500 uppercase mb-1 tracking-tighter">Protocolo de Acción:</p>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">{insight.action}</p>
            </div>
          </div>
        ))}
      </div>

      {/* KPI GRID PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Flujo de Ingresos" value={data.metrics.ingresos} color="text-emerald-400" />
        <StatCard label="Flujo de Gastos" value={data.metrics.gastos} color="text-rose-500" />
        
        <div className="bg-indigo-600 p-8 rounded-[3rem] flex flex-col justify-between md:col-span-2 relative overflow-hidden group shadow-2xl shadow-indigo-600/20">
            <Activity size={180} className="absolute -right-12 -bottom-12 opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700" />
            <div className="relative z-10">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-200 mb-2">Índice de Salud Financiera</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl sm:text-8xl font-black tracking-tighter italic text-white">{data.metrics.score}</span>
                <span className="text-3xl font-black text-indigo-300">/100</span>
              </div>
            </div>
            <div className="relative z-10 flex justify-between items-center mt-4">
               <span className="text-[10px] font-mono bg-black/20 px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/10">Algoritmo Optimizado</span>
               <TrendingUp size={24} className="text-white" />
            </div>
        </div>
      </div>

      {/* METAS Y VENCIMIENTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* COMPROMISOS */}
        <div className="bg-slate-900/20 border border-white/5 p-8 md:p-12 rounded-[3.5rem] space-y-8 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <AlertCircle className="text-amber-500" size={24} />
              </div>
              <div>
                <h3 className="font-black uppercase text-2xl italic tracking-tighter text-white">Vencimientos</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Obligaciones del ciclo actual</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <Row label="Gastos Fijos Programados" value={data.pendientes.gastosFijos} />
            <Row label="Amortización de Créditos" value={data.pendientes.cuotasCreditos} />
            <div className="pt-8 mt-4 border-t border-white/5 flex flex-col items-end">
              <span className="font-black text-[10px] uppercase text-indigo-500 tracking-[0.2em] mb-2">Liquidez Necesaria:</span>
              <span className="text-5xl font-black tracking-tighter font-mono text-white">{formatFull(data.pendientes.totalMes)}</span>
            </div>
          </div>
        </div>

        {/* PROGRESO META GLOBAL */}
        <div className="bg-gradient-to-br from-indigo-950/30 to-slate-900/30 border border-indigo-500/20 p-8 md:p-12 rounded-[3.5rem] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5">
            <Target size={200} />
          </div>
          
          <div className="flex justify-between items-start mb-12">
            <div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Progreso de Capital</h3>
              <p className="text-indigo-400 text-[10px] font-mono font-black uppercase tracking-widest mt-2">Consolidado de Metas Activas</p>
            </div>
            <div className="p-4 bg-indigo-500/10 rounded-3xl border border-indigo-500/20">
              <Target className="text-indigo-500" size={32} />
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                 <span className="text-[10px] font-black text-slate-500 uppercase mb-1">Estado Actual</span>
                 <span className="text-5xl font-black text-white font-mono tracking-tighter">
                   {data.meta.porcentaje.toFixed(1)}%
                 </span>
              </div>
              <div className="text-right">
                 <p className="text-xs font-mono text-slate-400">
                   {formatCompact(data.meta.actual)} <span className="text-indigo-500">/</span> {formatCompact(data.meta.objetivo)}
                 </p>
              </div>
            </div>
            
            <div className="h-8 w-full bg-black/40 rounded-full p-1.5 border border-white/5 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 via-indigo-400 to-emerald-400 rounded-full transition-all duration-[2000ms] ease-out shadow-[0_0_30px_rgba(79,70,229,0.5)]" 
                style={{ width: `${data.meta.porcentaje}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: any) {
  return (
    <div className="bg-[#0A0C10] border border-white/5 p-8 rounded-[2.5rem] hover:border-indigo-500/30 transition-all group shadow-xl">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 group-hover:text-slate-300 transition-colors">{label}</p>
      <div className="space-y-1">
        <p className={`text-4xl font-black tracking-tighter font-mono ${color}`}>
          {formatFull(value)}
        </p>
        <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full w-2/3 ${color.replace('text', 'bg')} opacity-50`} />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex justify-between items-center group py-2">
      <div className="flex items-center gap-3">
        <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full group-hover:scale-150 transition-transform" />
        <span className="text-slate-400 text-sm font-bold uppercase tracking-tighter group-hover:text-white transition-colors">{label}</span>
      </div>
      <span className="font-mono text-xl font-black text-slate-200 group-hover:text-indigo-400 transition-colors">{formatFull(value)}</span>
    </div>
  )
}