'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const TABLES = ['movements', 'budget_concepts', 'budget_amounts', 'debt_items', 'finance_settings'];

/**
 * Refresca la pantalla cuando alguien del hogar cambia datos de Finanzas
 * (Supabase Realtime). También refresca al volver a la app en el celular,
 * por si se perdió algún evento mientras estaba en segundo plano.
 */
export function RealtimeRefresh({ householdId }: { householdId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 400);
    };

    let channel = supabase.channel(`finanzas-${householdId}`);
    for (const table of TABLES) {
      channel = channel
        .on('postgres_changes', { event: '*', schema: 'public', table, filter: `household_id=eq.${householdId}` }, refresh)
        // Los DELETE no traen household_id, así que se escuchan sin filtro.
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table }, refresh);
    }
    channel.subscribe();

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, [householdId, router]);

  return null;
}
