import React from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { Toaster } from '@/components/ui/toast';
import { CaptureFab } from '@/components/planning/capture-fab';

/** Marco común de LifeHub (todas las pantallas con sesión). */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell fab={<CaptureFab />}>{children}</AppShell>
      <Toaster />
    </>
  );
}
