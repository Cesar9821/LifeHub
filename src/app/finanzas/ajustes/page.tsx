import { Settings, Download, Database, ShieldCheck, Users, Crown, UserMinus, Home } from 'lucide-react';
import { getHouseholdMembers, getHouseholdName, isHouseholdOwner } from '@/services/household';
import { removeMember, renameHousehold } from './actions';
import InviteMember from './invite-member';

const EXPORTS = [
  {
    tipo: 'movimientos',
    title: 'Movimientos',
    desc: 'Todo tu historial: pendientes y confirmados, con montos estimados y reales.',
  },
  {
    tipo: 'planificacion',
    title: 'Planificación',
    desc: 'Tus ingresos y gastos fijos configurados.',
  },
  {
    tipo: 'ahorros',
    title: 'Ahorros',
    desc: 'Metas de ahorro con su progreso actual.',
  },
  {
    tipo: 'creditos',
    title: 'Créditos',
    desc: 'Deudas, cuotas pagadas y saldo pendiente.',
  },
];

export default async function AjustesPage() {
  const [members, householdName, isOwner] = await Promise.all([
    getHouseholdMembers(),
    getHouseholdName(),
    isHouseholdOwner(),
  ]);

  return (
    <div className="space-y-8 md:space-y-12 pb-20 max-w-5xl">
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-md w-fit">
          <Settings size={14} className="text-indigo-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Configuración
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter italic leading-none">
          Ajustes<span className="text-indigo-500">.</span>
        </h1>
      </div>

      {/* HOGAR */}
      <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-2">
          <Users size={16} className="text-indigo-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
            Tu hogar
          </h2>
        </div>
        <p className="text-sm text-slate-500 font-medium mb-6 max-w-lg">
          Las finanzas se comparten entre todos los miembros del hogar. Cada quien
          entra con su cuenta, pero ven y editan la misma información.
        </p>

        {/* Nombre del hogar */}
        <form action={renameHousehold} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex items-center gap-2 flex-1">
            <Home size={15} className="text-slate-500 shrink-0" />
            <input
              name="name"
              defaultValue={householdName}
              placeholder="Nombre del hogar"
              className="flex-1 bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="bg-white/5 border border-white/10 text-slate-300 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all active:scale-95 shrink-0"
          >
            Guardar nombre
          </button>
        </form>

        {/* Miembros */}
        <div className="space-y-2 mb-8">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
            Miembros ({members.length})
          </p>

          {members.length === 0 ? (
            <p className="text-sm text-slate-600 font-medium">
              No se pudieron cargar los miembros. Verifica que hayas ejecutado
              <span className="text-slate-400 font-mono"> schema-household.sql</span> en Supabase.
            </p>
          ) : (
            members.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center justify-between gap-3 bg-black/20 border border-white/5 rounded-xl px-4 py-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 flex items-center justify-center font-black text-indigo-400 text-[10px] shrink-0">
                    {m.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-200 truncate">
                        {m.full_name}
                      </p>
                      {m.role === 'owner' && (
                        <Crown size={12} className="text-amber-400 shrink-0" />
                      )}
                      {m.is_me && (
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-wider shrink-0">
                          Tú
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 truncate">
                      {m.email}
                    </p>
                  </div>
                </div>

                {isOwner && !m.is_me && (
                  <form action={removeMember} className="shrink-0">
                    <input type="hidden" name="user_id" value={m.user_id} />
                    <button
                      type="submit"
                      title="Quitar del hogar"
                      className="p-2 text-slate-600 hover:text-rose-400 transition-colors opacity-60 md:opacity-0 md:group-hover:opacity-100"
                    >
                      <UserMinus size={15} />
                    </button>
                  </form>
                )}
              </div>
            ))
          )}
        </div>

        {/* Invitar */}
        {isOwner ? (
          <div className="pt-6 border-t border-white/5">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
              Agregar a alguien
            </p>
            <p className="text-xs text-slate-600 font-medium mb-4">
              La persona ya debe tener una cuenta creada en LifeHub. Escribe el
              correo con el que se registró.
            </p>
            <InviteMember />
          </div>
        ) : (
          <div className="pt-6 border-t border-white/5">
            <p className="text-xs text-slate-600 font-medium">
              Solo el dueño del hogar puede agregar o quitar miembros.
            </p>
          </div>
        )}
      </div>

      {/* RESPALDO */}
      <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-2">
          <Database size={16} className="text-emerald-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
            Respaldo de datos
          </h2>
        </div>
        <p className="text-sm text-slate-500 font-medium mb-8 max-w-lg">
          Descarga tu información en formato CSV. Puedes abrirlo en Excel o Google
          Sheets, y sirve como copia de seguridad de tus datos.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EXPORTS.map((e) => (
            <a
              key={e.tipo}
              href={`/api/export?tipo=${e.tipo}`}
              className="group flex items-start justify-between gap-4 bg-black/20 border border-white/5 rounded-2xl p-5 hover:border-emerald-500/30 transition-all"
            >
              <div className="min-w-0">
                <p className="text-sm font-black text-white mb-1">{e.title}</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {e.desc}
                </p>
              </div>
              <div className="shrink-0 p-2.5 bg-white/5 rounded-xl text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all">
                <Download size={16} />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* NOTA DE SEGURIDAD */}
      <div className="flex items-start gap-3 bg-indigo-500/5 border border-indigo-500/10 rounded-[1.75rem] p-6">
        <ShieldCheck size={18} className="text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-black text-white mb-1">Tus datos son privados</p>
          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
            Las finanzas están aisladas por hogar: solo sus miembros pueden verlas.
            Los datos de Mindset son personales de cada usuario, incluso dentro del
            mismo hogar.
          </p>
        </div>
      </div>
    </div>
  );
}
