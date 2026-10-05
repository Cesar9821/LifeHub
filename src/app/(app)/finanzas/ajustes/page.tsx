import Link from 'next/link';
import { Settings, Download, Database, ShieldCheck, Users, Crown, UserMinus, Home, Link2, ArrowRight } from 'lucide-react';
import { getHouseholdMembers, getHouseholdName, isHouseholdOwner } from '@/services/household';
import { removeMember, renameHousehold } from './actions';
import InviteMember from './invite-member';

const EXPORTS = [
  {
    tipo: 'gastos',
    title: 'Gastos e ingresos',
    desc: 'Todo lo registrado: concepto, monto, quién pagó y medio de pago.',
  },
  {
    tipo: 'presupuesto',
    title: 'Presupuesto',
    desc: 'Monto de cada concepto mes a mes, como la hoja del Excel.',
  },
  {
    tipo: 'ahorros',
    title: 'Ahorros',
    desc: 'Metas de ahorro con su progreso actual.',
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-line-strong bg-surface w-fit">
          <Settings size={14} className="text-indigo-400" />
          <span className="text-xs font-bold text-ink-2 tracking-wide">
            Configuración
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold text-ink tracking-tight leading-none">
          Ajustes<span className="text-indigo-500">.</span>
        </h1>
      </div>

      {/* HOGAR */}
      <div className="bg-surface border border-line rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-2 mb-2">
          <Users size={16} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-ink tracking-wide">
            Tu hogar
          </h2>
        </div>
        <p className="text-sm text-ink-3 font-medium mb-6 max-w-lg">
          Las finanzas se comparten entre todos los miembros del hogar. Cada quien
          entra con su cuenta, pero ven y editan la misma información.
        </p>

        {/* Nombre del hogar */}
        <form action={renameHousehold} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex items-center gap-2 flex-1">
            <Home size={15} className="text-ink-3 shrink-0" />
            <input
              name="name"
              defaultValue={householdName}
              placeholder="Nombre del hogar"
              className="flex-1 bg-black/30 border border-line-strong rounded-xl p-3 text-sm text-ink placeholder:text-ink-3 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="bg-white/5 border border-line-strong text-ink-2 px-5 py-3 rounded-xl font-semibold text-xs tracking-wide hover:bg-white/10 hover:text-ink transition-all active:scale-95 shrink-0"
          >
            Guardar nombre
          </button>
        </form>

        {/* Miembros */}
        <div className="space-y-2 mb-8">
          <p className="text-xs font-semibold text-ink-3 tracking-wide mb-3">
            Miembros ({members.length})
          </p>

          {members.length === 0 ? (
            <p className="text-sm text-ink-3 font-medium">
              No se pudieron cargar los miembros. Verifica que hayas ejecutado
              <span className="text-ink-2 tabular-nums"> schema-household.sql</span> en Supabase.
            </p>
          ) : (
            members.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center justify-between gap-3 bg-black/20 border border-line rounded-xl px-4 py-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-slate-800 to-slate-950 border border-line-strong flex items-center justify-center font-semibold text-indigo-400 text-xs shrink-0">
                    {m.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-ink truncate">
                        {m.full_name}
                      </p>
                      {m.role === 'owner' && (
                        <Crown size={12} className="text-amber-400 shrink-0" />
                      )}
                      {m.is_me && (
                        <span className="text-xs font-semibold text-indigo-400 tracking-wide shrink-0">
                          Tú
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-ink-3 truncate">
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
                      className="p-2 text-ink-3 hover:text-rose-400 transition-colors opacity-60 md:opacity-0 md:group-hover:opacity-100"
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
          <div className="pt-6 border-t border-line">
            <p className="text-xs font-semibold text-ink-3 tracking-wide mb-3">
              Agregar a alguien
            </p>
            <p className="text-xs text-ink-3 font-medium mb-4">
              La persona ya debe tener una cuenta creada en LifeHub. Escribe el
              correo con el que se registró.
            </p>
            <InviteMember />
          </div>
        ) : (
          <div className="pt-6 border-t border-line">
            <p className="text-xs text-ink-3 font-medium">
              Solo el dueño del hogar puede agregar o quitar miembros.
            </p>
          </div>
        )}
      </div>

      {/* CONEXIONES */}
      <Link
        href="/finanzas/conexiones"
        className="flex items-center justify-between gap-4 bg-surface border border-line rounded-3xl p-6 hover:border-white/15 transition-all"
      >
        <div className="flex items-center gap-3">
          <Link2 size={18} className="text-sky-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-ink">Mercado Pago</p>
            <p className="text-xs text-ink-3 font-medium">Conecta tu cuenta y sincroniza tus pagos.</p>
          </div>
        </div>
        <ArrowRight size={16} className="text-ink-3 shrink-0" />
      </Link>

      {/* RESPALDO */}
      <div className="bg-surface border border-line rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-2 mb-2">
          <Database size={16} className="text-emerald-400" />
          <h2 className="text-sm font-semibold text-ink tracking-wide">
            Respaldo de datos
          </h2>
        </div>
        <p className="text-sm text-ink-3 font-medium mb-8 max-w-lg">
          Descarga tu información en formato CSV. Puedes abrirlo en Excel o Google
          Sheets, y sirve como copia de seguridad de tus datos.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EXPORTS.map((e) => (
            <a
              key={e.tipo}
              href={`/api/export?tipo=${e.tipo}`}
              className="group flex items-start justify-between gap-4 bg-black/20 border border-line rounded-2xl p-5 hover:border-emerald-500/30 transition-all"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink mb-1">{e.title}</p>
                <p className="text-xs text-ink-3 font-medium leading-relaxed">
                  {e.desc}
                </p>
              </div>
              <div className="shrink-0 p-2.5 bg-white/5 rounded-xl text-ink-2 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all">
                <Download size={16} />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* NOTA DE SEGURIDAD */}
      <div className="flex items-start gap-3 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-6">
        <ShieldCheck size={18} className="text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-ink mb-1">Tus datos son privados</p>
          <p className="text-xs text-ink-3 font-medium leading-relaxed max-w-xl">
            Las finanzas están aisladas por hogar: solo sus miembros pueden verlas.
            Los datos de Mentalidad son personales de cada usuario, incluso dentro del
            mismo hogar.
          </p>
        </div>
      </div>
    </div>
  );
}
