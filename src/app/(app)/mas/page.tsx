import Link from 'next/link';
import { ChevronRight, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { getHouseholdName } from '@/services/household';
import { signout } from '@/app/auth/actions';
import { PageHeader } from '@/components/ui/card';
import { MORE_NAV } from '@/components/shell/nav-items';

export const dynamic = 'force-dynamic';

const DESCRIPTIONS: Record<string, string> = {
  '/capturas': 'Lo que anotaste al pasar, para ordenarlo',
  '/habitos': 'Tus hábitos de hoy y de la semana',
  '/enfoque': 'Temporizador para una tarea, sin distracciones',
  '/cierre': 'Qué salió bien, gratitud y con qué partes mañana',
  '/consejos': 'Ideas para tu día y tus favoritas',
  '/proyectos': 'InnVolt y otros proyectos, sin presión',
  '/familia': 'Compras, menú, eventos, tareas y cumpleaños',
  '/metas': 'Tus metas guardadas, como objetivos',
  '/vision': 'Fotos de lo que quieres lograr',
  '/notificaciones': 'Qué avisos recibir y a qué hora',
  '/finanzas/ajustes': 'Miembros del hogar, Mercado Pago y exportar',
};

export default async function MasPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: profile }, householdName] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    getHouseholdName(),
  ]);
  const name = profile?.full_name || user.email?.split('@')[0] || 'Tú';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Más" subtitle={`${name} · ${householdName}`} />

      <nav aria-label="Más secciones" className="bg-surface border border-line rounded-3xl divide-y divide-line overflow-hidden">
        {MORE_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 min-h-16 px-4 hover:bg-surface-2 transition-colors"
            >
              <span className="h-10 w-10 shrink-0 rounded-2xl bg-surface-3 inline-flex items-center justify-center text-ink-2">
                <Icon size={20} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-semibold text-ink">{item.label}</span>
                <span className="block text-sm text-ink-3 truncate">{DESCRIPTIONS[item.href]}</span>
              </span>
              <ChevronRight size={18} className="text-ink-3 shrink-0" />
            </Link>
          );
        })}
      </nav>

      <form action={signout}>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 min-h-12 rounded-2xl border border-line text-[15px] font-medium text-ink-2 hover:text-danger hover:border-danger/30"
        >
          <LogOut size={18} /> Cerrar sesión
        </button>
      </form>
    </div>
  );
}
