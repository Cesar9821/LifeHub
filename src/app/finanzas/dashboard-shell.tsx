'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signout } from '@/app/auth/actions';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Target, 
  CreditCard, 
  Wallet, 
  Menu, 
  X,
  Activity,
  CalendarDays,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ArrowLeft,
  PieChart,
  Tag,
  Repeat
} from 'lucide-react';

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

  // Efecto para cerrar el sidebar automáticamente al cambiar de ruta en móviles
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', href: '/finanzas/dashboard' },
    { icon: <Activity size={18} />, label: 'Movimientos', href: '/finanzas/movimientos' },
    { icon: <Repeat size={18} />, label: 'Planificación', href: '/finanzas/planificacion' },
    { icon: <PieChart size={18} />, label: 'Presupuestos', href: '/finanzas/presupuestos' },
    { icon: <Target size={18} />, label: 'Ahorros', href: '/finanzas/savings' },
    { icon: <CreditCard size={18} />, label: 'Créditos', href: '/finanzas/credits' },
    { icon: <Tag size={18} />, label: 'Categorías', href: '/finanzas/categories' },
    { icon: <BarChart3 size={18} />, label: 'Rendimiento', href: '/finanzas/performance' },
    { icon: <Settings size={18} />, label: 'Ajustes', href: '/finanzas/ajustes' },
  ];

  return (
    <div className="min-h-screen bg-[#050608] text-white relative overflow-hidden flex font-sans">
      
      {/* LUCES DE FONDO AMBIENTALES - Optimizadas para no estorbar el texto */}
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* OVERLAY MÓVIL CON BLUR */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-md z-[60] md:hidden transition-all duration-500 ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={() => setIsSidebarOpen(false)} 
      />

      {/* SIDEBAR ESTRATÉGICO */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-72 bg-[#0A0C10]/95 backdrop-blur-2xl border-r border-white/5 flex flex-col transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        md:static md:translate-x-0 md:w-64 lg:w-72
        ${isSidebarOpen ? 'translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.5)]' : '-translate-x-full'}
      `}>
        {/* LOGO SECTION */}
        <div className="p-8 pb-10">
          <div className="flex items-center justify-between md:justify-start gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-2.5 rounded-2xl shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)]">
                <Wallet size={20} className="text-white" />
              </div>
              <span className="inline-flex items-center font-black text-2xl tracking-tighter uppercase italic">
                Finanzas<span className="text-indigo-500">.<Activity size={25} className="text-emerald-400 animate-pulse" /></span>
              </span>
            </div>
            {/* Botón cerrar para móvil */}
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 px-4 space-y-2">
          <Link
            href="/hub"
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-black text-[10px] uppercase tracking-[0.15em] text-slate-500 hover:bg-white/5 hover:text-slate-200 group mb-4 border border-white/5"
          >
            <span className="group-hover:text-indigo-400 transition-colors duration-300">
              <ArrowLeft size={18} />
            </span>
            Volver al inicio
          </Link>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-black text-[10px] uppercase tracking-[0.15em] group
                  ${isActive 
                    ? 'bg-white text-black shadow-[0_10px_25px_-10px_rgba(255,255,255,0.3)] translate-x-1' 
                    : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}
                `}
              >
                <span className={`transition-colors duration-300 ${isActive ? 'text-indigo-600' : 'group-hover:text-indigo-400'}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col relative z-10 w-full">
        {/* HEADER GLASS - Adaptado para Responsive */}
        <header className="h-20 px-4 md:px-10 flex items-center justify-between border-b border-white/5 bg-[#050608]/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all active:scale-90 border border-white/5"
            >
              <Menu size={22} />
            </button>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <button className="relative p-2.5 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-white transition-all hidden sm:block">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#050608]"></span>
            </button>

            <div className="flex items-center gap-4 pl-4 border-l border-white/5">
              <div className="flex flex-col items-end hidden sm:flex leading-tight">
                  <span className="text-[11px] font-black text-white uppercase tracking-wider">{userName}</span>
                  <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest italic opacity-80">Miembro del hogar</span>
              </div>
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 flex items-center justify-center font-black text-indigo-500 shadow-2xl overflow-hidden relative">
                {userInitials}
              </div>
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
          </div>
        </header>

        {/* AREA DE TRABAJO - Scroll mejorado */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar">
          <div className="max-w-[1600px] mx-auto p-4 sm:p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}