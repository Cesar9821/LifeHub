import React from 'react';
import { SubNav } from '@/components/ui/sub-nav';
import { HABITS_NAV } from '@/components/planning/habits-nav';

/** Bienestar dentro de Hábitos: registro diario y La Forja. */
export default function MindsetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <SubNav items={HABITS_NAV} />
      {children}
    </div>
  );
}
