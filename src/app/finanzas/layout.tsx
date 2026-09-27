import React from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { loadPlanPage } from '@/services/plan';
import { QuickExpenseFab } from '@/components/finanzas/expense-sheet';
import { RealtimeRefresh } from '@/components/finanzas/realtime-refresh';
import { Toaster } from '@/components/ui/toast';
import DashboardShell from './dashboard-shell';

// Ícono y nombre propios al agregar Finanzas a la pantalla de inicio del iPhone.
export const metadata: Metadata = {
  title: 'Finanzas',
  appleWebApp: {
    capable: true,
    title: 'Finanzas',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icon-inicio-192.png',
    apple: '/apple-icon-inicio.png',
  },
};

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  const userName =
    profile?.full_name || user.email?.split('@')[0] || 'Usuario';

  // Registro rápido y tiempo real disponibles en todas las pantallas de Finanzas.
  const { plan, quick, householdId } = await loadPlanPage();

  return (
    <>
      <DashboardShell userName={userName} userInitials={initialsFrom(userName)}>
        {children}
      </DashboardShell>
      {plan.seeded && <QuickExpenseFab data={quick} />}
      <RealtimeRefresh householdId={householdId} />
      <Toaster />
    </>
  );
}
