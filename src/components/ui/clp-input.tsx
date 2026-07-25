'use client';

import { useState } from 'react';

/**
 * Input de monto con formato CLP en vivo: al escribir 1000 muestra "1.000".
 * Envía el valor numérico limpio (sin puntos) en el campo `name` real,
 * usando un input oculto, para que el server action lo reciba como número.
 */
export function CLPInput({
  name,
  defaultValue = '',
  placeholder = '0',
  required = false,
  autoFocus = false,
  className = '',
  accent = 'indigo',
}: {
  name: string;
  defaultValue?: string | number;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  className?: string;
  accent?: 'indigo' | 'emerald';
}) {
  const format = (digits: string) => {
    const clean = digits.replace(/\D/g, '');
    if (!clean) return '';
    return new Intl.NumberFormat('es-CL').format(parseInt(clean, 10));
  };

  const [display, setDisplay] = useState(
    defaultValue ? format(String(defaultValue)) : ''
  );
  const raw = display.replace(/\./g, '');

  const ring =
    accent === 'emerald'
      ? 'focus:ring-emerald-500/50 focus:border-emerald-500'
      : 'focus:ring-indigo-500/50 focus:border-indigo-500';

  const baseStyles =
    className ||
    `bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 ${ring} transition-all backdrop-blur-md w-full`;

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold pointer-events-none">
        $
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => setDisplay(format(e.target.value))}
        className={`${baseStyles} pl-7`}
      />
      {/* Valor real numérico que recibe el server action */}
      <input type="hidden" name={name} value={raw} required={required} />
    </div>
  );
}
