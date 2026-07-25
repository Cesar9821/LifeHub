import Link from 'next/link';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { shiftPeriod, periodLabel, isCurrentPeriod, periodOf } from '@/services/movements';

/**
 * Navegación entre meses. Usa el query param ?mes=YYYY-MM
 */
export default function MonthSelector({
  period,
  basePath = '/finanzas/movimientos',
}: {
  period: string;
  basePath?: string;
}) {
  const prev = shiftPeriod(period, -1).slice(0, 7);
  const next = shiftPeriod(period, 1).slice(0, 7);
  const isCurrent = isCurrentPeriod(period);

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <Link
        href={`${basePath}?mes=${prev}`}
        title="Mes anterior"
        className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all active:scale-90 shrink-0"
      >
        <ChevronLeft size={16} />
      </Link>

      <div className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md sm:min-w-[150px]">
        <CalendarDays size={13} className="text-indigo-400 shrink-0" />
        <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-[0.1em] sm:tracking-[0.15em] whitespace-nowrap">
          {periodLabel(period)}
        </span>
      </div>

      <Link
        href={`${basePath}?mes=${next}`}
        title="Mes siguiente"
        className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all active:scale-90 shrink-0"
      >
        <ChevronRight size={16} />
      </Link>

      {!isCurrent && (
        <Link
          href={basePath}
          className="px-3 py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-wider hover:bg-indigo-500/20 transition-all shrink-0"
        >
          Hoy
        </Link>
      )}
    </div>
  );
}
