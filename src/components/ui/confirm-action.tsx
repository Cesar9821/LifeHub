'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { SubmitButton } from '@/components/ui/submit-button';

/** Llama a onDone cuando la acción del formulario termina. */
function CloseWhenDone({ onDone }: { onDone: () => void }) {
  const { pending } = useFormStatus();
  const started = useRef(false);
  useEffect(() => {
    if (pending) started.current = true;
    else if (started.current) {
      started.current = false;
      onDone();
    }
  }, [pending, onDone]);
  return null;
}

/**
 * Botón que pide confirmación dentro de la app (no usa window.confirm)
 * antes de ejecutar una acción irreversible.
 */
export function ConfirmAction({
  action,
  fields,
  title,
  message,
  confirmLabel = 'Borrar',
  children,
  triggerClassName,
  triggerTitle,
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  title: string;
  message: string;
  confirmLabel?: string;
  children: ReactNode;
  triggerClassName?: string;
  triggerTitle?: string;
}) {
  const [open, setOpen] = useState(false);

  // Escape cierra; el fondo no se desplaza mientras está abierto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button type="button" title={triggerTitle} onClick={() => setOpen(true)} className={triggerClassName}>
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/70 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            className="w-full max-w-sm bg-surface-2 border border-line-strong rounded-3xl p-6 space-y-4 animate-sheet-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-ink">{title}</h3>
              <p className="text-sm text-ink-2">{message}</p>
            </div>
            <form action={action} className="grid grid-cols-2 gap-3">
              <CloseWhenDone onDone={() => setOpen(false)} />
              {Object.entries(fields).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 rounded-xl border border-line-strong text-ink font-semibold text-sm hover:bg-surface-3"
              >
                Cancelar
              </button>
              <SubmitButton className="min-h-11 bg-danger text-bg hover:bg-danger/90">{confirmLabel}</SubmitButton>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
