import { Bell, User, Search } from "lucide-react";

export function Navbar() {
  return (
    <div className="flex items-center p-6 border-b border-white/5 bg-[#0A0C10]/50 backdrop-blur-xl justify-between sticky top-0 z-50">
      {/* SECCIÓN IZQUIERDA: Contexto */}
      <div className="flex items-center gap-x-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
          <Search size={14} className="text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar operación..." 
            className="bg-transparent border-none outline-none text-xs text-slate-400 placeholder:text-slate-600 w-48"
          />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hidden sm:inline-block">
          System / <span className="text-indigo-500">Active</span>
        </span>
      </div>

      {/* SECCIÓN DERECHA: Notificaciones y Perfil */}
      <div className="flex items-center gap-x-3 md:gap-x-6">
        <button className="relative p-2.5 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10 group">
          <Bell className="h-5 w-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0A0C10] animate-pulse"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-black text-white leading-none uppercase tracking-tighter">Administrador</span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Nivel 1</span>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-slate-800 border border-white/10 flex items-center justify-center text-indigo-400 shadow-inner group cursor-pointer hover:border-indigo-500/50 transition-all">
            <User size={20} className="group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  )
}