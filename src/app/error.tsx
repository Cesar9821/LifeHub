'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

/**
 * Error boundary a nivel de app. Cualquier error no controlado en un Server
 * Component o Server Action cae aquí, en vez de dejar la pantalla en blanco.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900/40 border border-white/5 rounded-[2rem] p-8 backdrop-blur-xl text-center space-y-5">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <AlertTriangle size={26} className="text-rose-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">
            Algo salió mal
          </h2>
          <p className="text-sm text-slate-400">
            No se pudo completar la operación. Tus datos no se modificaron.
            Puedes reintentar.
          </p>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-black text-sm hover:bg-slate-200 transition-all active:scale-95"
        >
          <RotateCw size={16} /> Reintentar
        </button>
      </div>
    </div>
  );
}
