'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDays, longDateLabel, shortDayLabel } from '@/lib/planning/dates';

const chip = 'shrink-0 min-h-11 px-4 rounded-full text-sm font-medium border whitespace-nowrap transition-colors';
const on = 'bg-ink text-bg border-ink';
const off = 'bg-surface border-line-strong text-ink-2 hover:text-ink';

/**
 * Elegir el día en un toque: Hoy, Mañana, los días de la semana que vienen
 * u "Otra fecha". Envía `name` con la fecha YYYY-MM-DD (vacío = sin fecha).
 */
export function DayPicker({
  name = 'due_date',
  today,
  value,
  onChange,
  allowNone = false,
  days = 7,
}: {
  name?: string;
  today: string;
  value: string;
  onChange: (date: string) => void;
  /** Muestra "Sin fecha" como opción. */
  allowNone?: boolean;
  days?: number;
}) {
  const inputId = useId();
  const dateRef = useRef<HTMLInputElement>(null);
  const quick = Array.from({ length: days }, (_, i) => addDays(today, i));
  const [picking, setPicking] = useState(false);
  const other = picking || (value !== '' && !quick.includes(value));
  const choose = (d: string) => {
    setPicking(false);
    onChange(d);
  };

  useEffect(() => {
    if (!picking) return;
    const el = dateRef.current;
    el?.focus();
    try {
      el?.showPicker?.();
    } catch {
      // Algunos navegadores no permiten abrirlo sin un toque directo.
    }
  }, [picking]);
  const label = (d: string, i: number) => {
    if (i === 0) return 'Hoy';
    if (i === 1) return 'Mañana';
    const s = shortDayLabel(d);
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={value} />
      <div role="radiogroup" aria-label="Día" className="-mx-1 px-1 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 w-max">
          {allowNone && (
            <button type="button" role="radio" aria-checked={value === ''} onClick={() => choose('')} className={cn(chip, value === '' ? on : off)}>
              Sin fecha
            </button>
          )}
          {quick.map((d, i) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={value === d}
              aria-label={i < 2 ? `${label(d, i)}, ${longDateLabel(d)}` : longDateLabel(d)}
              onClick={() => choose(d)}
              className={cn(chip, value === d ? on : off)}
            >
              {label(d, i)}
            </button>
          ))}
          <button
            type="button"
            role="radio"
            aria-checked={other}
            aria-controls={inputId}
            onClick={() => setPicking(true)}
            className={cn(chip, 'inline-flex items-center gap-1.5', other ? on : off)}
          >
            <CalendarDays size={15} /> Otra fecha
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 min-h-6 px-1">
        {other && (
          <input
            ref={dateRef}
            id={inputId}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Otra fecha"
            className="w-40 min-h-11 bg-surface-2 border border-line-strong rounded-xl px-3 text-[15px] text-ink outline-none focus:border-accent"
          />
        )}
        <p className="text-sm text-ink-2" aria-live="polite">
          {value ? longDateLabel(value) : 'Sin fecha'}
        </p>
      </div>
    </div>
  );
}
