import Link from 'next/link';
import { ArrowRight, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadHabitsToday } from '@/services/habits';
import { toggleHabit } from '@/app/(app)/mindset/actions';
import { Card, PageHeader } from '@/components/ui/card';
import { CheckButton } from '@/components/ui/check-button';
import { EmptyState } from '@/components/ui/empty-state';
import { SubNav } from '@/components/ui/sub-nav';
import { HABITS_NAV } from '@/components/planning/habits-nav';
import { HabitActions, NewHabitButton } from '@/components/planning/habit-parts';

export const dynamic = 'force-dynamic';

/** Hábitos simples: ¿lo hice hoy? y ¿cómo voy esta semana? Sin rachas ni medallas. */
export default async function HabitosPage() {
  const { habits, dueCount, doneCount } = await loadHabitsToday();
  const today = habits.filter((h) => h.pendingToday || h.doneToday);
  const rest = habits.filter((h) => !h.pendingToday && !h.doneToday);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <SubNav items={HABITS_NAV} />
      <PageHeader title="Hábitos" subtitle={dueCount > 0 ? `Hoy: ${doneCount} de ${dueCount}` : 'Pocos y simples.'}>
        <NewHabitButton />
      </PageHeader>

      {habits.length === 0 ? (
        <EmptyState
          icon={<Repeat size={28} />}
          title="Crea tus primeros hábitos."
          text="Ideas: Gym (L·Mi·V), Oración, Agua, Alimentación, Lectura, Dormir a la hora."
        />
      ) : (
        <>
          <Card as="section" aria-label="Hoy" className="space-y-1">
            <h2 className="text-[16px] font-semibold text-ink mb-1">Hoy</h2>
            {today.length === 0 ? (
              <p className="text-[15px] text-ink-2">Hoy no te toca ninguno.</p>
            ) : (
              <ul>
                {today.map((h) => (
                  <li key={h.id} className="flex items-center gap-3 min-h-12">
                    <form action={toggleHabit}>
                      <input type="hidden" name="habit_id" value={h.id} />
                      <input type="hidden" name="done" value={String(h.doneToday)} />
                      <CheckButton done={h.doneToday} label={h.name} />
                    </form>
                    <span className={cn('flex-1 min-w-0 text-[16px]', h.doneToday ? 'text-ink-3 line-through' : 'text-ink')}>{h.name}</span>
                    <span className="text-sm text-ink-3 tabular-nums">
                      {h.weekDone}/{h.weekTarget}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card as="section" aria-label="Esta semana" className="space-y-3">
            <h2 className="text-[16px] font-semibold text-ink">Esta semana</h2>
            <ul className="space-y-3">
              {habits.map((h) => {
                const pct = Math.min(100, Math.round((h.weekDone / Math.max(1, h.weekTarget)) * 100));
                return (
                  <li key={h.id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[15px] text-ink truncate">{h.name}</span>
                        <span className="text-sm text-ink-2 tabular-nums shrink-0">
                          {h.weekDone}/{h.weekTarget} esta semana
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden" aria-hidden>
                        <div className={cn('h-full rounded-full', pct >= 100 ? 'bg-success' : 'bg-area-habitos')} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-ink-3">{h.frequencyText}</p>
                    </div>
                    <HabitActions habit={h} />
                  </li>
                );
              })}
            </ul>
            {rest.length > 0 && <p className="text-sm text-ink-3">{rest.length} no tocan hoy o ya cumpliste la meta semanal.</p>}
          </Card>
        </>
      )}

      <Link href="/mindset" className="flex items-center justify-between gap-3 min-h-14 px-5 rounded-3xl bg-surface border border-line text-[15px] text-ink-2 hover:text-ink">
        Registro diario: ánimo, sueño, energía y agua <ArrowRight size={16} />
      </Link>
    </div>
  );
}
