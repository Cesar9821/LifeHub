import React from 'react';
import { SubNav } from '@/components/ui/sub-nav';

/** Hábitos y bienestar: registro diario, La Forja y gestión de hábitos. */
export default function MindsetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <SubNav
        items={[
          { label: 'Hábitos de hoy', href: '/habitos', exact: true },
          { label: 'Registro diario', href: '/mindset', exact: true },
          { label: 'La Forja', href: '/mindset/forja' },
          { label: 'Gestionar', href: '/mindset/habitos' },
        ]}
      />
      {children}
    </div>
  );
}
