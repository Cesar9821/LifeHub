import React from 'react';
import { cn } from '@/lib/utils';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';

const TONES: Record<Tone, string> = {
  success: 'bg-success/10 text-success border-success/25',
  warning: 'bg-warning/10 text-warning border-warning/25',
  danger: 'bg-danger/10 text-danger border-danger/25',
  info: 'bg-info/10 text-info border-info/25',
  neutral: 'bg-surface-3 text-ink-2 border-line-strong',
  accent: 'bg-accent/10 text-accent border-accent/25',
};

/** Etiqueta de estado (Pendiente, Vencido, Esperando…). */
export function Chip({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap',
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Texto de color según el tono (montos, contadores). */
export const TONE_TEXT: Record<Tone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  neutral: 'text-ink-2',
  accent: 'text-accent',
};
