import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

interface Props {
  ingresos: number;
  gastos: number;
  patrimonio: number;
}

export default function BalanceCards({ ingresos, gastos, patrimonio }: Props) {
  const format = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

  const cards = [
    { 
      label: 'Ingresos Mensuales', 
      value: ingresos, 
      icon: <ArrowUpRight className="text-emerald-500" />, 
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/5'
    },
    { 
      label: 'Gastos Ejecutados', 
      value: gastos, 
      icon: <ArrowDownRight className="text-rose-500" />, 
      color: 'text-rose-500',
      bg: 'bg-rose-500/5'
    },
    { 
      label: 'Patrimonio Neto', 
      value: patrimonio, 
      icon: <Wallet className="text-indigo-500" />, 
      color: 'text-white',
      bg: 'bg-indigo-500/5'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, i) => (
        <div 
          key={i} 
          className="p-8 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] hover:border-white/10 transition-all group relative overflow-hidden"
        >
          <div className={`absolute -right-4 -top-4 w-24 h-24 ${card.bg} rounded-full blur-3xl group-hover:scale-150 transition-transform`} />
          
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{card.label}</span>
            <div className="p-2 bg-white/5 rounded-xl border border-white/5 group-hover:rotate-12 transition-transform">
              {card.icon}
            </div>
          </div>
          
          <div className="relative z-10">
            <h3 className={`text-3xl font-black tracking-tighter ${card.color}`}>
              {format(card.value)}
            </h3>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[9px] font-mono text-slate-600 uppercase">Live Update</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}