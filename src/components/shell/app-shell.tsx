'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { signout } from '@/app/auth/actions';
import { cn } from '@/lib/utils';
import { MAIN_NAV, MORE_NAV, isActive, type NavItem } from './nav-items';

function SideLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item) && !(item.href === '/finanzas' && pathname.startsWith('/finanzas/ajustes'));
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 min-h-11 px-3 rounded-xl text-[15px] font-medium transition-colors',
        active ? 'bg-surface-3 text-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
      )}
    >
      <Icon size={19} className={active ? 'text-accent' : 'text-ink-3'} />
      {item.label}
    </Link>
  );
}

/**
 * Marco de toda la app: barra inferior en el celular (Hoy · Semana · Trabajo ·
 * Finanzas · Más) y menú lateral en escritorio. `fab` es el botón "+" global.
 */
export function AppShell({ children, fab }: { children: React.ReactNode; fab?: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-bg text-ink lg:flex">
      {/* MENÚ LATERAL (escritorio) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-dvh border-r border-line px-3 py-6">
        <Link href="/hoy" className="px-3 mb-8 text-xl font-semibold tracking-tight text-ink">
          LifeHub
        </Link>
        <nav aria-label="Principal" className="space-y-1">
          {MAIN_NAV.filter((i) => i.href !== '/mas').map((item) => (
            <SideLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
        <p className="px-3 mt-8 mb-2 text-xs font-medium text-ink-3">Más</p>
        <nav aria-label="Más secciones" className="space-y-1 flex-1 overflow-y-auto">
          {MORE_NAV.map((item) => (
            <SideLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
        <form action={signout} className="pt-4">
          <button
            type="submit"
            className="w-full flex items-center gap-3 min-h-11 px-3 rounded-xl text-[15px] font-medium text-ink-3 hover:bg-surface-2 hover:text-ink"
          >
            <LogOut size={19} /> Cerrar sesión
          </button>
        </form>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 min-w-0">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10 pt-[max(1rem,env(safe-area-inset-top))] lg:pt-8 pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:pb-16">
          {children}
        </div>
      </main>

      {fab}

      {/* BARRA INFERIOR (celular y tablet) */}
      <nav
        aria-label="Principal"
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-line pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="grid grid-cols-5 max-w-lg mx-auto">
          {MAIN_NAV.map((item) => {
            const active = isActive(pathname, item) && !(item.href === '/finanzas' && pathname.startsWith('/finanzas/ajustes'));
            const moreActive = item.href === '/mas' && pathname.startsWith('/finanzas/ajustes');
            const on = active || moreActive;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={on ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 min-h-[60px] text-xs font-medium transition-colors',
                    on ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex items-center justify-center h-7 w-12 rounded-full transition-colors',
                      on && 'bg-accent/15 text-accent'
                    )}
                  >
                    <Icon size={21} strokeWidth={on ? 2.25 : 1.75} />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
