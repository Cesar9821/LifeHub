'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Hoja inferior (bottom sheet) en el celular; diálogo centrado en escritorio.
 * Cierra con Escape, con el fondo o con la X. Respeta el safe area.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-surface-2 border border-line-strong rounded-t-3xl sm:rounded-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-sheet-up',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden />
        {title && (
          <div className="flex items-center justify-between gap-3 mb-4 pr-1">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="h-11 w-11 -mr-1 shrink-0 inline-flex items-center justify-center rounded-full text-ink-3 hover:text-ink hover:bg-surface-3"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
