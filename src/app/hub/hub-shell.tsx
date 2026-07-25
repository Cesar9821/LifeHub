'use client';

import React from 'react';
import Link from 'next/link';
import { signout } from '@/app/auth/actions';
import { Activity, LogOut, Bell } from 'lucide-react';

export default function HubShell({
  children,
  userName,
  userInitials,
}: {
  children: React.ReactNode;
  userName: string;
  userInitials: string;
}) {
  return (
    <div className="min-h-screen bg-[#050608] text-white relative overflow-hidden font-sans">
      {/* Luces ambientales */}
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-emerald-600/5 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-10 px-6 md:px-10 lg:px-16 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-black text-xl tracking-tighter uppercase italic">
            Life<span className="text-indigo-500">Hub</span>
          </span>
          <Activity size={18} className="text-emerald-400 animate-pulse" />
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-[11px] font-black text-white uppercase tracking-wider">{userName}</span>
            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest italic opacity-80">
              Miembro del hogar
            </span>
          </div>
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 flex items-center justify-center font-black text-indigo-500 shadow-2xl shrink-0">
            {userInitials}
          </div>
          <Link
            href="/notificaciones"
            title="Notificaciones"
            className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all active:scale-90"
          >
            <Bell size={18} />
          </Link>
          <form action={signout}>
            <button
              type="submit"
              title="Cerrar sesión"
              className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all active:scale-90"
            >
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </header>

      <main className="relative z-10 px-6 md:px-10 lg:px-16 pb-20">
        {children}
      </main>
    </div>
  );
}
