'use client';

import { cn } from '@/lib/utils';

/** Grupo de opciones de un toque (radio visual), 44px de alto. */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  label,
  allowNone = false,
}: {
  options: { value: T; label: string }[];
  value: T | '';
  onChange: (v: T | '') => void;
  label: string;
  /** Tocar la opción elegida la deselecciona. */
  allowNone?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(on && allowNone ? '' : o.value)}
            className={cn(
              'min-h-11 px-4 rounded-full text-sm font-medium border transition-colors',
              on ? 'bg-ink text-bg border-ink' : 'bg-surface border-line-strong text-ink-2 hover:text-ink'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
