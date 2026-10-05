'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Recarga los datos al volver a la app (celular en segundo plano) sin
 * suscripciones en tiempo real: suficiente para Hoy y Semana.
 */
export function RefreshOnFocus() {
  const router = useRouter();
  useEffect(() => {
    let last = Date.now();
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - last < 30_000) return;
      last = Date.now();
      router.refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [router]);
  return null;
}
