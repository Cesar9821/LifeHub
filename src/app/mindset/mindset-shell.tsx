'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signout } from '@/app/auth/actions';
import {
  Brain,
  Flame,
  ListChecks,
  ArrowLeft,
  LogOut,
  Activity,
} from 'lucide-react';

export default function MindsetShell({
  children,
  userName,
  userInitials,
}: {
  children: React.ReactNode;
  userName: string;
  userInitials: string;
}) {
  const pathname = usePathname();

  const menuItems = [
    { icon: <Flame size={18} />, label: 'Hoy', href: '/mindset' },
    { icon: <ListChecks size={18} />, label: 'Hábitos', href: '/mindset/habitos' },
  ];

  return (
    <div className="min-h-screen bg-[#050608] text-white flex font-sans">
      {/* Luces ambientales */}
      <div className="fixed top-[-10%] left-[20%] w-[45%] h-[45%] bg-violet-600/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-orange-600/5 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl relative z-10">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-gradient-to-br from-violet-500 to-violet-700 p-2 rounded-xl">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-lg tracking-tighter uppercase italic">
              Menta<span className="text-violet-400">lidad</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link
            href="/hub"
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-black text-[10px] uppercase tracking-[0.15em] text-slate-500 hover:bg-white/5 hover:text-slate-200 group mb-4 border border-white/5"
          >
            <span className="group-hover:text-violet-400 transition-colors duration-300">
              <ArrowLeft size={18} />
            </span>
            Volver al inicio
          </Link>

          {menuItems.map((item) => {
            const active =
              item.href === '/mindset'
                ? pathname === '/mindset'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-black text-[10px] uppercase tracking-[0.15em] group ${
                  active
                    ? 'bg-violet-500/10 text-white border border-violet-500/20'
                    : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span
                  className={`transition-colors duration-300 ${
                    active ? 'text-violet-400' : 'group-hover:text-violet-400'
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 flex items-center justify-center font-black text-violet-400 text-xs">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-white uppercase tracking-wider truncate">
                {userName}
              </p>
              <p className="text-[9px] font-bold text-violet-500 uppercase tracking-widest italic">
                Disciplina
              </p>
            </div>
            <form action={signout}>
              <button
                type="submit"
                title="Cerrar sesión"
                className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* CONTENIDO */}
      <div className="flex-1 min-w-0 relative z-10">
        {/* Header móvil */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#050608]/90 backdrop-blur-xl">
          <Link href="/hub" className="p-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-violet-400" />
            <span className="font-black text-sm uppercase tracking-tighter italic">
              Menta<span className="text-violet-400">lidad</span>
            </span>
          </div>
          <form action={signout}>
            <button type="submit" className="p-2 text-slate-500 hover:text-rose-400 transition-colors">
              <LogOut size={18} />
            </button>
          </form>
        </header>

        {/* Nav móvil */}
        <nav className="lg:hidden flex gap-2 px-5 py-3 border-b border-white/5 overflow-x-auto">
          {menuItems.map((item) => {
            const active =
              item.href === '/mindset'
                ? pathname === '/mindset'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap font-black text-[10px] uppercase tracking-wider transition-all ${
                  active
                    ? 'bg-violet-500/10 text-white border border-violet-500/20'
                    : 'text-slate-500 border border-white/5'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="p-5 md:p-8 lg:p-12">{children}</main>
      </div>
    </div>
  );
}
