'use client';

import { Suspense, useActionState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LogoMark } from '@/components/brand/logo-mark';
import { login, type AuthState } from '@/app/auth/actions';
import { Activity, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/hoy';
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, undefined);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 relative overflow-hidden">

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <LogoMark className="h-20 w-20 mb-6" />
          <h1 className="text-5xl font-semibold text-ink tracking-tight">
            LifeHub
          </h1>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line-strong bg-surface">
            <Activity size={12} className="text-emerald-400" />
            <span className="text-xs font-bold text-ink-2 tracking-wide">Acceso al sistema</span>
          </div>
        </div>

        <form action={formAction} className="bg-surface border border-line rounded-3xl p-8 md:p-10 space-y-5">
          <input type="hidden" name="next" value={next} />

          {state?.error && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold px-4 py-3 rounded-2xl">
              <AlertCircle size={16} className="shrink-0" />
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="auth-email" className="text-sm font-medium text-ink-2 pl-2">Correo</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@correo.com"
              className="w-full bg-surface-2 border border-line-strong rounded-2xl px-5 py-4 text-ink font-medium placeholder:text-ink-3 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="auth-password" className="text-sm font-medium text-ink-2 pl-2">Contraseña</label>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full bg-surface-2 border border-line-strong rounded-2xl px-5 py-4 text-ink font-medium placeholder:text-ink-3 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-white text-black px-8 py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Entrando…' : 'Entrar'}
            {!pending && <ArrowRight className="h-5 w-5" />}
          </button>
        </form>

        <p className="text-center text-ink-3 text-xs font-bold mt-8">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Crear una
          </Link>
        </p>
      </div>
    </div>
  );
}
