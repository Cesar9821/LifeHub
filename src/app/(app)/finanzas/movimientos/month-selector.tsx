import Link from 'next/link';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { shiftPeriod, periodLabel, isCurrentPeriod } from '@/services/movements';

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
        className="p-2.5 bg-white/5 border border-line rounded-xl text-ink-2 hover:text-ink hover:border-white/20 transition-all active:scale-90 shrink-0"
      >
        <ChevronLeft size={16} />
      </Link>

      <div className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-line-strong bg-surface sm:min-w-[150px]">
        <CalendarDays size={13} className="text-indigo-400 shrink-0" />
        <span className="text-xs sm:text-xs font-semibold text-ink tracking-wide sm:tracking-wide whitespace-nowrap">
          {periodLabel(period)}
        </span>
      </div>

      <Link
        href={`${basePath}?mes=${next}`}
        title="Mes siguiente"
        className="p-2.5 bg-white/5 border border-line rounded-xl text-ink-2 hover:text-ink hover:border-white/20 transition-all active:scale-90 shrink-0"
      >
        <ChevronRight size={16} />
      </Link>

      {!isCurrent && (
        <Link
          href={basePath}
          className="px-3 py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-semibold tracking-wide hover:bg-indigo-500/20 transition-all shrink-0"
        >
          Hoy
        </Link>
      )}
    </div>
  );
}
