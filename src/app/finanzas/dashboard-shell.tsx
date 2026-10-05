'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signout } from '@/app/auth/actions';
import {
  ArrowLeft,
  CalendarRange,
  CreditCard,
  Home,
  ListOrdered,
  LogOut,
  Menu,
  PieChart,
  Settings,
  Target,
  Wallet,
  X,
} from 'lucide-react';

type NavItem = { icon: React.ReactNode; label: string; href: string };

/** Pantallas del módulo (menú lateral y "Más"). */
const MENU: NavItem[] = [
  { icon: <Home size={18} />, label: 'Mes', href: '/finanzas' },
  { icon: <ListOrdered size={18} />, label: 'Movimientos', href: '/finanzas/movimientos' },
  { icon: <PieChart size={18} />, label: 'Presupuesto', href: '/finanzas/presupuestos' },
  { icon: <CreditCard size={18} />, label: 'Deuda CMR', href: '/finanzas/credits' },
  { icon: <CalendarRange size={18} />, label: 'Resumen anual', href: '/finanzas/resumen' },
  { icon: <Target size={18} />, label: 'Ahorros', href: '/finanzas/savings' },
  { icon: <Settings size={18} />, label: 'Ajustes', href: '/finanzas/ajustes' },
];

/** Pestañas de abajo en el celular (lo del día a día). */
const TABS: NavItem[] = [
  { icon: <Home size={20} />, label: 'Mes', href: '/finanzas' },
  { icon: <ListOrdered size={20} />, label: 'Movimientos', href: '/finanzas/movimientos' },
  { icon: <PieChart size={20} />, label: 'Presupuesto', href: '/finanzas/presupuestos' },
  { icon: <CreditCard size={20} />, label: 'Deuda', href: '/finanzas/credits' },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/finanzas' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardShell({
  children,
  userName,
  userInitials,
}: {
  children: React.ReactNode;
  userName: string;
  userInitials: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Cierra el menú al cambiar de pantalla (celular).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSidebarOpen(false);
  }, [pathname]);

  const onMoreTab = !TABS.some((t) => isActive(pathname, t.href));

  return (
    <div className="min-h-screen bg-bg text-ink relative overflow-hidden flex font-sans">
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* OVERLAY MÓVIL */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-md z-[60] md:hidden transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* MENÚ LATERAL (escritorio) / "Más" (celular) */}
      <aside
        className={`fixed inset-y-0 left-0 z-[70] w-72 bg-surface/95 backdrop-blur-2xl border-r border-line flex flex-col transition-transform duration-300
          md:static md:translate-x-0 md:w-64 lg:w-72
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 pb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-2.5 rounded-2xl">
              <Wallet size={20} className="text-ink" />
            </div>
            <span className="font-semibold text-2xl tracking-tight">
              Finanzas<span className="text-emerald-400">.</span>
            </span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2.5 text-ink-3 hover:text-ink" aria-label="Cerrar menú">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {MENU.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 min-h-12 rounded-2xl transition-all font-semibold text-xs tracking-wide ${
                  active ? 'bg-white text-black' : 'text-ink-2 hover:bg-white/5 hover:text-ink'
                }`}
              >
                <span className={active ? 'text-emerald-600' : ''}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-2 border-t border-line">
          <Link
            href="/hub"
            className="flex items-center gap-3 px-4 min-h-12 rounded-2xl font-semibold text-xs tracking-wide text-ink-3 hover:bg-white/5 hover:text-ink"
          >
            <ArrowLeft size={18} /> Volver a LifeHub
          </Link>
          <form action={signout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 min-h-12 rounded-2xl font-semibold text-xs tracking-wide text-ink-3 hover:bg-rose-500/10 hover:text-rose-400"
            >
              <LogOut size={18} /> Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 flex flex-col relative z-10 w-full min-w-0">
        <header className="h-16 px-4 md:px-10 flex items-center justify-between border-b border-line bg-bg/70 backdrop-blur-xl sticky top-0 z-50">
          <Link href="/finanzas" className="md:hidden font-semibold text-lg tracking-tight">
            Finanzas<span className="text-emerald-400">.</span>
          </Link>
          <span className="hidden md:block" />
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs font-semibold text-ink-2 tracking-wide">{userName}</span>
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-line-strong flex items-center justify-center font-semibold text-emerald-400 text-sm">
              {userInitials}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-[1400px] mx-auto p-4 sm:p-8 lg:p-10 pb-28 md:pb-12">{children}</div>
        </div>
      </main>

      {/* PESTAÑAS INFERIORES (celular) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-[50] bg-surface/95 backdrop-blur-xl border-t border-line-strong pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegación de Finanzas"
      >
        <div className="grid grid-cols-5">
          {TABS.map((t) => {
            const active = isActive(pathname, t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex flex-col items-center justify-center gap-1 min-h-16 text-xs font-semibold ${
                  active ? 'text-emerald-400' : 'text-ink-3'
                }`}
              >
                {t.icon}
                {t.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 min-h-16 text-xs font-semibold ${
              onMoreTab ? 'text-emerald-400' : 'text-ink-3'
            }`}
          >
            <Menu size={20} />
            Más
          </button>
        </div>
      </nav>
    </div>
  );
}
