'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const EVENT = 'lifehub-toast';

/** Muestra un aviso breve arriba de la pantalla (requiere <Toaster /> montado). */
export function toast(message: string) {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: message }));
}

/** Contenedor de avisos: montarlo una vez por layout. */
export function Toaster() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onToast = (e: Event) => {
      setMessage((e as CustomEvent<string>).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(null), 3000);
    };
    window.addEventListener(EVENT, onToast);
    return () => {
      window.removeEventListener(EVENT, onToast);
      clearTimeout(timer);
    };
  }, []);

  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed z-[95] left-1/2 -translate-x-1/2 top-[calc(1rem+env(safe-area-inset-top))] flex items-center gap-2 max-w-[90vw] px-4 py-3 rounded-2xl bg-surface-3 border border-line-strong text-ink text-sm font-medium shadow-lg shadow-black/40 animate-fade-in"
    >
      <CheckCircle2 size={18} className="shrink-0 text-success" />
      {message}
    </div>
  );
}

/**
 * Envuelve una Server Action con contrato FormState y muestra el aviso de
 * éxito apenas responde el servidor. Así el aviso aparece aunque el
 * formulario desaparezca al refrescarse la pantalla (por ejemplo, un estado
 * vacío que deja de mostrarse).
 */
export function withSuccessToast<S extends { ok: boolean; message?: string }>(
  action: (prev: S, formData: FormData) => Promise<S>,
  fallback = 'Guardado.'
) {
  return async (prev: S, formData: FormData): Promise<S> => {
    const result = await action(prev, formData);
    if (result.ok) toast(result.message ?? fallback);
    return result;
  };
}
