'use client';

import { useActionState } from 'react';
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { addMember, type MemberActionState } from './actions';

export default function InviteMember() {
  const [state, formAction, pending] = useActionState<MemberActionState, FormData>(
    addMember,
    undefined
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          name="email"
          type="email"
          required
          placeholder="correo@ejemplo.com"
          className="flex-1 bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50 shrink-0"
        >
          <UserPlus size={15} />
          {pending ? 'Agregando…' : 'Agregar'}
        </button>
      </div>

      {state?.ok && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold px-4 py-3 rounded-xl">
          <CheckCircle2 size={15} className="shrink-0" />
          {state.ok}
        </div>
      )}
      {state?.error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold px-4 py-3 rounded-xl">
          <AlertCircle size={15} className="shrink-0" />
          {state.error}
        </div>
      )}
    </form>
  );
}
