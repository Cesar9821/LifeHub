import Link from 'next/link';
import { ArrowLeft, CalendarCheck } from 'lucide-react';
import { todayStr } from '@/lib/format';
import { cn } from '@/lib/utils';
import { addDays, dayName, isDateStr, weekDates, weekRangeLabel, weekStartOf } from '@/lib/planning/dates';
import { dayLoad, findConflicts } from '@/lib/planning/conflicts';
import { daysLabel } from '@/lib/planning/recurrence';
import { isOpen } from '@/lib/planning/tasks';
import { loadTasks } from '@/services/tasks';
import { loadAgenda, loadRoutines, loadWeeklyPlan, timedItems } from '@/services/planning';
import { finishPlanning, toggleTaskThisWeek } from '../actions';
import { Card, PageHeader } from '@/components/ui/card';
import { SubmitButton } from '@/components/ui/submit-button';
import { AreaDot } from '@/components/planning/area';
import { LoadLine } from '@/components/planning/load-badge';
import { PlanningSetupCard } from '@/components/planning/setup-card';
import { AddBlockButton, WeekGoalsForm } from '@/components/planning/week-parts';

export const dynamic = 'force-dynamic';

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card as="section" aria-labelledby={`paso-${n}`} className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="h-7 w-7 shrink-0 rounded-full bg-surface-3 text-sm font-semibold text-ink inline-flex items-center justify-center">
          {n}
        </span>
        <div>
          <h2 id={`paso-${n}`} className="text-[16px] font-semibold text-ink">
            {title}
          </h2>
          {hint && <p className="text-sm text-ink-3">{hint}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

/**
 * Planificar semana: una sola pantalla con 7 pasos cortos. Primero lo fijo
 * (rutinas, eventos), después lo pendiente, máximo 3 objetivos, y conflictos.
 */
export default async function PlanificarPage({ searchParams }: { searchParams: Promise<{ semana?: string }> }) {
  const { semana } = await searchParams;
  const today = todayStr();
  const weekStart = weekStartOf(isDateStr(semana) ? semana : today);
  const days = weekDates(weekStart);

  const [{ ready: routinesReady, routines }, agenda, { tasks }, plan] = await Promise.all([
    loadRoutines(),
    loadAgenda(weekStart, addDays(weekStart, 6)),
    loadTasks(),
    loadWeeklyPlan(weekStart),
  ]);
  const ready = routinesReady && agenda.ready;
  const activeRoutines = routines.filter((r) => r.active && (!r.valid_until || r.valid_until >= weekStart));
  const fixed = agenda.items.filter((i) => i.source === 'event' || i.source === 'family' || i.source === 'block');
  const candidates = tasks
    .filter((t) => isOpen(t) && t.status !== 'inbox' && t.status !== 'esperando' && !t.due_date)
    .slice(0, 20);
  const conflicts = findConflicts(timedItems(agenda.items));
  const loads = days.map((d) => ({ d, load: dayLoad(timedItems(agenda.items.filter((i) => i.date === d))) }));
  const busy = loads.filter(({ load }) => load.status !== 'holgado');

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link href={`/semana?semana=${weekStart}`} className="inline-flex items-center gap-1.5 min-h-11 text-sm font-medium text-ink-2 hover:text-ink">
        <ArrowLeft size={16} /> Semana
      </Link>
      <PageHeader title="Planificar semana" subtitle={`${weekRangeLabel(weekStart)} · unos 5 minutos`} />
      {!ready && <PlanningSetupCard />}

      <Step n={1} title="Tus rutinas" hint="Lo fijo. Ya está en tu semana.">
        {activeRoutines.length === 0 ? (
          <p className="text-[15px] text-ink-2">
            Sin rutinas. <Link href="/semana/rutinas" className="text-accent">Crea las tuyas</Link> (gym, trabajo…).
          </p>
        ) : (
          <ul className="space-y-1.5">
            {activeRoutines.map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-[15px] text-ink">
                <AreaDot area={r.area} />
                <span className="flex-1 truncate">{r.title}</span>
                <span className="text-sm text-ink-3 shrink-0">
                  {daysLabel(r.days_of_week)} · {r.start_time}–{r.end_time}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Step>

      <Step n={2} title="Lo que ya está agendado" hint="Eventos y bloques de esta semana.">
        {fixed.length === 0 ? (
          <p className="text-[15px] text-ink-2">Nada agendado todavía.</p>
        ) : (
          <ul className="space-y-1.5">
            {fixed.map((i) => (
              <li key={i.key} className="flex items-center gap-2 text-[15px] text-ink">
                <AreaDot area={i.area} />
                <span className="w-20 shrink-0 text-sm text-ink-3">{dayName(i.date).slice(0, 3)} {i.start ?? ''}</span>
                <span className="truncate">{i.title}</span>
              </li>
            ))}
          </ul>
        )}
      </Step>

      <Step n={3} title="Pendientes sin fecha" hint="Marca solo lo que de verdad cabe esta semana.">
        {candidates.length === 0 ? (
          <p className="text-[15px] text-ink-2">No hay pendientes sueltos. 👌</p>
        ) : (
          <ul className="divide-y divide-line">
            {candidates.map((t) => {
              const inWeek = t.planned_week === weekStart;
              return (
                <li key={t.id} className="flex items-center gap-3 py-1">
                  <AreaDot area={t.area} />
                  <span className="flex-1 min-w-0 text-[15px] text-ink truncate">{t.title}</span>
                  <form action={toggleTaskThisWeek}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="week_start" value={weekStart} />
                    <input type="hidden" name="in_week" value={String(inWeek)} />
                    <button
                      type="submit"
                      aria-pressed={inWeek}
                      className={cn(
                        'min-h-11 px-3.5 rounded-xl border text-sm font-medium whitespace-nowrap',
                        inWeek ? 'bg-ink text-bg border-ink' : 'border-line-strong text-ink-2 hover:text-ink'
                      )}
                    >
                      {inWeek ? '✓ Esta semana' : 'Esta semana'}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Step>

      <Step n={4} title="Hasta 3 objetivos" hint="Lo que quieres lograr. Pocos, para que se cumplan.">
        <WeekGoalsForm weekStart={weekStart} focus={plan.focus} objectives={plan.objectives} />
      </Step>

      <Step n={5} title="¿Algo más que agendar?" hint="Tiempo familiar, una reunión, una hora para InnVolt…">
        <AddBlockButton initial={{ date: weekStart >= today ? weekStart : today }} label="Agregar actividad" className="w-full" />
      </Step>

      <Step n={6} title="Revisa los choques y la carga" hint="Deja ~30% libre: en Inmade siempre aparece algo.">
        {conflicts.length === 0 && busy.length === 0 ? (
          <p className="text-[15px] text-success">Sin choques y con espacio para imprevistos.</p>
        ) : (
          <div className="space-y-2">
            {conflicts.map((c) => (
              <p key={`${c.a.id}-${c.b.id}`} className="text-[15px] text-warning">
                {dayName(c.date)}: {c.a.title} y {c.b.title} se cruzan.
              </p>
            ))}
            {busy.map(({ d, load }) => (
              <div key={d} className="flex items-center justify-between gap-3">
                <span className="text-[15px] text-ink">{dayName(d)}</span>
                <LoadLine load={load} />
              </div>
            ))}
          </div>
        )}
      </Step>

      <form action={finishPlanning}>
        <input type="hidden" name="week_start" value={weekStart} />
        <SubmitButton pendingText="Guardando…" className="w-full min-h-12 text-[15px]" disabled={!ready}>
          <CalendarCheck size={18} /> Listo, guardar semana
        </SubmitButton>
      </form>
    </div>
  );
}
