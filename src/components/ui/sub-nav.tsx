'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface SubNavItem {
  label: string;
  href: string;
  /** Coincidencia exacta (para la pantalla raíz de una sección). */
  exact?: boolean;
}

/** Pestañas secundarias de una sección (desplazables en el celular). */
export function SubNav({ items, className }: { items: SubNavItem[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones" className={cn('-mx-4 px-4 overflow-x-auto no-scrollbar', className)}>
      <ul className="flex gap-1.5 w-max">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center min-h-11 px-4 rounded-full text-sm font-medium whitespace-nowrap border transition-colors',
                  active
                    ? 'bg-ink text-bg border-ink'
                    : 'bg-surface border-line text-ink-2 hover:text-ink hover:border-line-strong'
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
