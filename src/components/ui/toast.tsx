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
      className="fixed z-[95] left-1/2 -translate-x-1/2 top-[calc(1rem+env(safe-area-inset-top))] flex items-center gap-2 max-w-[90vw] px-4 py-3 rounded-2xl bg-emerald-500 text-black text-sm font-black shadow-[0_12px_30px_-8px_rgba(16,185,129,0.6)] animate-in fade-in slide-in-from-top-2"
    >
      <CheckCircle2 size={18} className="shrink-0" />
      {message}
    </div>
  );
}
