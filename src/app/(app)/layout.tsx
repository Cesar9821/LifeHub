import React from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { Toaster } from '@/components/ui/toast';

/** Marco común de LifeHub (todas las pantallas con sesión). */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <Toaster />
    </>
  );
}
