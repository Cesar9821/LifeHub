'use client';

import { useState } from 'react';
import { formatStored, formatTyped } from '@/lib/number-input';

export interface NumberInputProps {
  name: string;
  defaultValue?: number | string | null;
  /** Decimales permitidos (0 = entero). Se escriben con coma: 1,3 */
  decimals?: number;
  /** Texto antes del número, ej. "$". */
  prefix?: string;
  /** Unidad después del número, ej. "kg". */
  suffix?: string;
  allowNegative?: boolean;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  /** Reemplaza los estilos base del input. */
  className?: string;
  accent?: 'indigo' | 'emerald' | 'amber';
  invalid?: boolean;
}

const RING = {
  indigo: 'focus:ring-indigo-500/50 focus:border-indigo-500',
  emerald: 'focus:ring-emerald-500/50 focus:border-emerald-500',
  amber: 'focus:ring-amber-500/50 focus:border-amber-500',
};

/**
 * Input numérico con formato chileno en vivo: 100.000 · 1,3 · 47.498,33.
 * Envía el valor limpio ("100000", "1.3") en un input oculto con `name`.
 */
export function NumberInput({
  name,
  defaultValue,
  decimals = 0,
  prefix,
  suffix,
  allowNegative = false,
  placeholder = '0',
  required = false,
  autoFocus = false,
  className,
  accent = 'indigo',
  invalid = false,
}: NumberInputProps) {
  const [state, setState] = useState(() => formatStored(defaultValue, decimals));

  const base =
    className ||
    `bg-slate-900/50 border ${invalid ? 'border-rose-500/60' : 'border-slate-800'} rounded-xl p-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 ${RING[accent]} transition-all backdrop-blur-md w-full`;

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode={decimals > 0 ? 'decimal' : 'numeric'}
        autoComplete="off"
        value={state.display}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => setState(formatTyped(e.target.value, decimals, allowNegative))}
        className={`${base} ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-12' : ''}`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold pointer-events-none">
          {suffix}
        </span>
      )}
      <input type="hidden" name={name} value={state.value} required={required} />
    </div>
  );
}
