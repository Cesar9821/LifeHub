'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { register, type AuthState } from '@/app/auth/actions';
import { LayoutGrid, Activity, ArrowRight, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(register, undefined);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-4 rounded-3xl mb-6 shadow-[0_0_50px_-12px_rgba(79,70,229,0.5)]">
            <LayoutGrid className="h-9 w-9 text-ink" />
          </div>
          <h1 className="text-5xl font-semibold text-ink tracking-tight">
            Life<span className="text-indigo-500">Hub</span>
          </h1>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line-strong bg-surface">
            <Activity size={12} className="text-emerald-400" />
            <span className="text-xs font-bold text-ink-2 tracking-wide">Crear cuenta</span>
          </div>
        </div>

        <form action={formAction} className="bg-surface border border-line rounded-[2.5rem] p-8 md:p-10 space-y-5">
          {state?.error && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold px-4 py-3 rounded-2xl">
              <AlertCircle size={16} className="shrink-0" />
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-ink-3 tracking-wide pl-2">Nombre</label>
            <input
              name="full_name"
              type="text"
              autoComplete="name"
              required
              placeholder="Cómo te llamas"
              className="w-full bg-black/30 border border-line-strong rounded-2xl px-5 py-4 text-ink font-medium placeholder:text-ink-3 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-ink-3 tracking-wide pl-2">Correo</label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@correo.com"
              className="w-full bg-black/30 border border-line-strong rounded-2xl px-5 py-4 text-ink font-medium placeholder:text-ink-3 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-ink-3 tracking-wide pl-2">Contraseña</label>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className="w-full bg-black/30 border border-line-strong rounded-2xl px-5 py-4 text-ink font-medium placeholder:text-ink-3 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-white text-black px-8 py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Creando…' : 'Crear cuenta'}
            {!pending && <ArrowRight className="h-5 w-5" />}
          </button>
        </form>

        <p className="text-center text-ink-3 text-xs font-bold mt-8">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
