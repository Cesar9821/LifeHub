import Link from 'next/link';
import { ArrowRight, Briefcase, CalendarDays, Sun, Wallet } from 'lucide-react';

const PILLARS = [
  { icon: Sun, title: 'Hoy', text: 'Tus 3 prioridades y lo que toca ahora.' },
  { icon: CalendarDays, title: 'Semana', text: 'Rutinas, familia y trabajo en un vistazo.' },
  { icon: Briefcase, title: 'Trabajo', text: 'Pendientes y lo que está esperando a otros.' },
  { icon: Wallet, title: 'Finanzas', text: 'Cuánto queda, qué falta pagar y si puedes gastar.' },
];

/** Portada pública (con sesión se redirige a /hoy desde el proxy). */
export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-bg text-ink px-5 py-16 flex flex-col">
      <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center">
        <p className="text-sm font-medium text-ink-3">Tu sistema personal y familiar</p>
        <h1 className="mt-2 text-5xl font-semibold tracking-tight">LifeHub</h1>
        <p className="mt-4 text-lg text-ink-2 max-w-md">
          No organiza información: organiza tu atención. Abres la app y sabes qué toca ahora.
        </p>

        <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <li key={p.title} className="bg-surface border border-line rounded-3xl p-5">
                <Icon size={20} className="text-accent" />
                <p className="mt-3 font-semibold">{p.title}</p>
                <p className="mt-1 text-sm text-ink-2">{p.text}</p>
              </li>
            );
          })}
        </ul>

        <Link
          href="/login"
          className="mt-10 inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-2xl bg-ink text-bg font-semibold hover:bg-white"
        >
          Entrar <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
