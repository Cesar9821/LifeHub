import React from 'react';
import type { Metadata } from 'next';
import { loadPlanPage } from '@/services/plan';
import { RealtimeRefresh } from '@/components/finanzas/realtime-refresh';
import { SubNav } from '@/components/ui/sub-nav';

// Ícono y nombre propios al agregar Finanzas a la pantalla de inicio del iPhone.
export const metadata: Metadata = {
  title: 'Finanzas',
  appleWebApp: {
    capable: true,
    title: 'Finanzas',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icon-inicio-192.png?v=2',
    apple: '/apple-icon-inicio.png?v=2',
  },
};

const SECTIONS = [
  { label: 'Mes', href: '/finanzas', exact: true },
  { label: 'Movimientos', href: '/finanzas/movimientos' },
  { label: 'Presupuesto', href: '/finanzas/presupuestos' },
  { label: 'Deuda', href: '/finanzas/credits' },
  { label: 'Resumen anual', href: '/finanzas/resumen' },
  { label: 'Ahorros', href: '/finanzas/savings' },
  { label: 'Ajustes', href: '/finanzas/ajustes' },
];

export default async function FinanzasLayout({ children }: { children: React.ReactNode }) {
  // Tiempo real en todas las pantallas de Finanzas. El "+ Gasto" es el botón global.
  const { householdId } = await loadPlanPage();

  return (
    <div className="space-y-5">
      <SubNav items={SECTIONS} />
      {children}
      <RealtimeRefresh householdId={householdId} />
    </div>
  );
}
