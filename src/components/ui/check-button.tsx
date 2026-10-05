'use client';

import { useFormStatus } from 'react-dom';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Botón circular para marcar/desmarcar (44px de área táctil). Va dentro de un
 * <form action={…}> que hace el cambio en el servidor.
 */
export function CheckButton({ done, label, className }: { done: boolean; label: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={done}
      aria-label={done ? `Desmarcar: ${label}` : `Marcar como hecho: ${label}`}
      className={cn('h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-full -m-1.5', className)}
    >
      <span
        className={cn(
          'h-6 w-6 rounded-full border-2 inline-flex items-center justify-center transition-colors',
          done ? 'bg-success border-success text-bg' : 'border-ink-3 hover:border-ink'
        )}
      >
        {pending ? <Loader2 size={13} className="animate-spin" /> : done ? <Check size={14} strokeWidth={3} /> : null}
      </span>
    </button>
  );
}
