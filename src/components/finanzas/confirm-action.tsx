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

  return (
    <>
      <button type="button" title={triggerTitle} onClick={() => setOpen(true)} className={triggerClassName}>
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-sm bg-[#0F1117] border border-white/10 rounded-3xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-white">{title}</h3>
              <p className="text-sm text-slate-400">{message}</p>
            </div>
            <form action={action} className="grid grid-cols-2 gap-3">
              <CloseWhenDone onDone={() => setOpen(false)} />
              {Object.entries(fields).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 rounded-xl border border-white/10 text-slate-300 font-black text-xs uppercase tracking-wider hover:bg-white/5"
              >
                Cancelar
              </button>
              <SubmitButton className="min-h-11 bg-rose-600 text-white hover:bg-rose-500">{confirmLabel}</SubmitButton>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
