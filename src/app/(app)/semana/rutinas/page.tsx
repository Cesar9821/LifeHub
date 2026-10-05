import Link from 'next/link';
import { ArrowLeft, Repeat } from 'lucide-react';
import { todayStr } from '@/lib/format';
import { loadRoutines } from '@/services/planning';
import { seedMyRoutines } from '../actions';
import { PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SubmitButton } from '@/components/ui/submit-button';
import { PlanningSetupCard } from '@/components/planning/setup-card';
import { NewRoutineButton, RoutineRow } from '@/components/planning/routine-form';

export const dynamic = 'force-dynamic';

/** Rutinas: la estructura fija de la semana (se repiten solas, sin duplicar datos). */
export default async function RutinasPage() {
  const { ready, routines } = await loadRoutines();
  const today = todayStr();
  const current = routines.filter((r) => !r.valid_until || r.valid_until >= today);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link href="/semana" className="inline-flex items-center gap-1.5 min-h-11 text-sm font-medium text-ink-2 hover:text-ink">
        <ArrowLeft size={16} /> Semana
      </Link>
      <PageHeader title="Rutinas" subtitle="Lo que se repite cada semana. Se agenda solo.">
        {ready && <NewRoutineButton />}
      </PageHeader>
      {!ready && <PlanningSetupCard />}

      {ready && current.length === 0 && (
        <EmptyState icon={<Repeat size={28} />} title="Aún no hay rutinas" text="Partamos con tu semana base. Después puedes ajustar horarios y días.">
          <ul className="mt-2 text-sm text-ink-2 space-y-0.5">
            <li>🏋️ Gym · L · Mi · V · 06:00–07:00</li>
            <li>💼 Inmade · Lunes a jueves · 08:30–18:30</li>
            <li>💼 Inmade · Viernes · 08:30–15:30</li>
          </ul>
          <form action={seedMyRoutines} className="mt-3">
            <SubmitButton pendingText="Creando…">Usar esta semana base</SubmitButton>
          </form>
        </EmptyState>
      )}

      {current.length > 0 && (
        <ul className="bg-surface border border-line rounded-3xl px-4 divide-y divide-line">
          {current.map((r) => (
            <RoutineRow key={r.id} routine={r} />
          ))}
        </ul>
      )}

      <p className="text-sm text-ink-3">
        Para cambiar un solo día (por ejemplo, Gym en la tarde el miércoles), tócalo en la semana y elige “Solo este día”.
      </p>
    </div>
  );
}
