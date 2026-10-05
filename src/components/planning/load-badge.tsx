import { cn } from '@/lib/utils';
import type { DayLoad, LoadStatus } from '@/lib/planning/conflicts';

export const LOAD_DOT: Record<LoadStatus, string> = {
  holgado: 'bg-success',
  justo: 'bg-warning',
  lleno: 'bg-danger',
};

const LOAD_TEXT: Record<LoadStatus, string> = {
  holgado: 'Con espacio para imprevistos',
  justo: 'Justo: deja algo libre',
  lleno: 'Muy lleno: cuida tu margen',
};

/** Regla 70/30 en palabras simples (sin alarmas). */
export function LoadLine({ load }: { load: DayLoad }) {
  const pct = Math.round(Math.max(load.freeRatio, load.workRatio) * 100);
  return (
    <p className="flex items-center gap-2 text-sm text-ink-2">
      <span className={cn('h-2 w-2 rounded-full shrink-0', LOAD_DOT[load.status])} aria-hidden />
      {LOAD_TEXT[load.status]}
      {pct > 0 && <span className="text-ink-3 tabular-nums">· {pct}% planificado</span>}
    </p>
  );
}
