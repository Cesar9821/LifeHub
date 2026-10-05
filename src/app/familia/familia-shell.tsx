'use client';

import React from 'react';
import Link from 'next/link';
import { signout } from '@/app/auth/actions';
import { Users, ArrowLeft, LogOut } from 'lucide-react';

export default function FamiliaShell({
  children,
  userName,
  userInitials,
  householdName,
}: {
  children: React.ReactNode;
  userName: string;
  userInitials: string;
  householdName: string;
}) {
  return (
    <div className="min-h-screen bg-bg text-ink flex font-sans">
      {/* Luces ambientales */}
      <div className="fixed top-[-10%] left-[20%] w-[45%] h-[45%] bg-orange-600/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-rose-600/5 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-line bg-black/20 relative z-10">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-xl">
              <Users className="h-5 w-5 text-ink" />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              Fami<span className="text-orange-400">lia</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link
            href="/hub"
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-semibold text-xs tracking-wide text-ink-3 hover:bg-white/5 hover:text-ink group mb-4 border border-line"
          >
            <span className="group-hover:text-orange-400 transition-colors duration-300">
              <ArrowLeft size={18} />
            </span>
            Volver al inicio
          </Link>

          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-xs tracking-wide bg-orange-500/10 text-ink border border-orange-500/20">
            <Users size={18} className="text-orange-400" />
            {householdName}
          </div>
        </nav>

        <div className="p-4 border-t border-line">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 border border-line-strong flex items-center justify-center font-semibold text-orange-400 text-xs">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink tracking-wide truncate">
                {userName}
              </p>
              <p className="text-xs font-bold text-orange-500 tracking-wide">
                En casa
              </p>
            </div>
            <form action={signout}>
              <button
                type="submit"
                title="Cerrar sesión"
                className="p-2 text-ink-3 hover:text-rose-400 transition-colors"
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
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-5 py-4 border-b border-line bg-bg/90 backdrop-blur-xl">
          <Link href="/hub" className="p-2 text-ink-2 hover:text-ink transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-orange-400" />
            <span className="font-semibold text-sm tracking-tight">
              Fami<span className="text-orange-400">lia</span>
            </span>
          </div>
          <form action={signout}>
            <button type="submit" className="p-2 text-ink-3 hover:text-rose-400 transition-colors">
              <LogOut size={18} />
            </button>
          </form>
        </header>

        <main className="p-5 md:p-8 lg:p-12">{children}</main>
      </div>
    </div>
  );
}
