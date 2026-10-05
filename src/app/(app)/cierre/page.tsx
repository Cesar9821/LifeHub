import { Moon } from 'lucide-react';
import { todayStr } from '@/lib/format';
import { longDateLabel } from '@/lib/planning/dates';
import { MOODS, streakLabel } from '@/lib/wellbeing';
import { loadReflections, loadWellbeingToday, WELLBEING_SQL_MISSING } from '@/services/wellbeing';
import { Card, PageHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ClosingForm } from '@/components/wellbeing/closing-form';

export const dynamic = 'force-dynamic';

/** Cierre del día: el de hoy y tu diario de días anteriores. */
export default async function CierrePage() {
  const today = todayStr();
  const [w, history] = await Promise.all([loadWellbeingToday(), loadReflections(60)]);
  const past = history.items.filter((r) => r.day !== today);
  const label = streakLabel(w.closingStreak, 'cerrando el día');

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PageHeader title="Cierre del día" subtitle="Un minuto en la noche para soltar el día y partir mejor mañana." />
      {label && <Chip tone="accent">🌙 {label}</Chip>}

      {!w.ready ? (
        <p className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm text-ink-2">{WELLBEING_SQL_MISSING}</p>
      ) : (
        <Card as="section" className="space-y-3">
          <h2 className="text-[16px] font-semibold text-ink">{w.reflection ? 'Hoy (puedes editarlo)' : 'Hoy'}</h2>
          <ClosingForm key={w.reflection?.closed_at ?? 'nuevo'} initial={w.reflection} />
        </Card>
      )}

      <section aria-labelledby="diario" className="space-y-2">
        <h2 id="diario" className="px-1 text-[16px] font-semibold text-ink">
          Tu diario
        </h2>
        {past.length === 0 ? (
          <EmptyState icon={<Moon size={28} />} title="Aún no hay días cerrados" text="Cuando cierres tus días, aparecen aquí para releerlos." />
        ) : (
          <ul className="space-y-3">
            {past.map((r) => {
              const mood = MOODS.find((m) => m.value === String(r.mood ?? ''));
              return (
                <li key={r.day} className="rounded-3xl border border-line bg-surface p-4 space-y-2">
                  <p className="flex items-center gap-2 text-sm font-medium text-ink-3">
                    {mood && <span aria-label={mood.name}>{mood.label}</span>}
                    {longDateLabel(r.day)}
                  </p>
                  {r.went_well && (
                    <p className="text-[15px] text-ink">
                      <span className="text-ink-3">Salió bien: </span>
                      {r.went_well}
                    </p>
                  )}
                  {r.grateful && (
                    <p className="text-[15px] text-ink">
                      <span className="text-ink-3">Agradecí: </span>
                      {r.grateful}
                    </p>
                  )}
                  {r.tomorrow_first && (
                    <p className="text-sm text-ink-2">
                      <span className="text-ink-3">Al día siguiente: </span>
                      {r.tomorrow_first}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
