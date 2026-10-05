import Link from 'next/link';
import { AlertTriangle, CalendarCheck, ChevronLeft, ChevronRight, Repeat, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  addDays,
  DAY_LETTERS,
  dayName,
  isoDow,
  longDateLabel,
  weekDates,
  weekRangeLabel,
  weekStartOf,
} from '@/lib/planning/dates';
import { dayLoad, findConflicts } from '@/lib/planning/conflicts';
import { isOpen } from '@/lib/planning/tasks';
import type { Task } from '@/services/tasks';
import { timedItems, type AgendaItem, type WeeklyPlan } from '@/services/planning';
import { Card } from '@/components/ui/card';
import { AgendaList } from '@/components/planning/agenda-list';
import { LoadLine, LOAD_DOT } from '@/components/planning/load-badge';
import { PlanningSetupCard } from '@/components/planning/setup-card';
import { TaskRow } from '@/components/planning/task-row';
import { AddBlockButton, EditGoalsButton, ObjectivesList } from '@/components/planning/week-parts';

export interface SemanaData {
  today: string;
  /** Hora actual en Chile (HH:MM). */
  now: string;
  weekStart: string;
  selected: string;
  ready: boolean;
  agenda: AgendaItem[];
  tasks: Task[];
  plan: WeeklyPlan | null;
  routinesCount: number;
}

const navBtn =
  'h-11 w-11 inline-flex items-center justify-center rounded-full bg-surface border border-line text-ink-2 hover:text-ink';

/** Mi Semana: la herramienta principal de organización (lunes → domingo). */
export function SemanaView({ today, now, weekStart, selected, ready, agenda, tasks, plan, routinesCount }: SemanaData) {
  const days = weekDates(weekStart);
  const thisWeek = weekStartOf(today) === weekStart;

  const itemsOf = (d: string) => agenda.filter((i) => i.date === d);
  const tasksOf = (d: string) =>
    tasks.filter((t) => isOpen(t) && t.status !== 'inbox' && t.due_date === d && !t.due_time);
  const loads = new Map(days.map((d) => [d, dayLoad(timedItems(itemsOf(d)))]));
  const conflicts = findConflicts(timedItems(agenda));
  const unscheduled = tasks.filter((t) => isOpen(t) && !t.due_date && t.planned_week === weekStart);
  const sel = days.includes(selected) ? selected : days[0];

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <header className="flex items-center justify-between gap-3 pt-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-3">{thisWeek ? 'Esta semana' : 'Semana'}</p>
          <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-ink">{weekRangeLabel(weekStart)}</h1>
        </div>
        <nav aria-label="Cambiar de semana" className="flex items-center gap-2 shrink-0">
          <Link href={`/semana?semana=${addDays(weekStart, -7)}`} className={navBtn} aria-label="Semana anterior">
            <ChevronLeft size={20} />
          </Link>
          {!thisWeek && (
            <Link href="/semana" className="min-h-11 px-3 inline-flex items-center rounded-full bg-surface border border-line text-sm font-medium text-ink-2">
              Hoy
            </Link>
          )}
          <Link href={`/semana?semana=${addDays(weekStart, 7)}`} className={navBtn} aria-label="Semana siguiente">
            <ChevronRight size={20} />
          </Link>
        </nav>
      </header>

      {!ready && <PlanningSetupCard />}

      {/* FOCO Y OBJETIVOS */}
      {ready && (
        <Card as="section" aria-label="Objetivos de la semana" className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-ink-3">Prioridad principal</p>
              <p className="text-[17px] font-semibold text-ink">{plan?.focus || 'Sin definir todavía'}</p>
            </div>
            <EditGoalsButton weekStart={weekStart} focus={plan?.focus ?? null} objectives={plan?.objectives ?? []} />
          </div>
          <ObjectivesList weekStart={weekStart} objectives={plan?.objectives ?? []} />
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href={`/semana/planificar?semana=${weekStart}`}
              className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-ink text-bg text-sm font-semibold hover:bg-white"
            >
              <CalendarCheck size={16} /> {plan?.planned_at ? 'Revisar plan' : 'Planificar semana'}
            </Link>
            <Link
              href="/semana/rutinas"
              className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl border border-line-strong text-sm font-medium text-ink-2 hover:text-ink"
            >
              <Repeat size={16} /> Rutinas{routinesCount > 0 ? ` (${routinesCount})` : ''}
            </Link>
            {isoDow(today) >= 5 && thisWeek && (
              <Link
                href={`/semana/revision?semana=${weekStart}`}
                className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl border border-line-strong text-sm font-medium text-ink-2 hover:text-ink"
              >
                <Sparkles size={16} /> Revisión
              </Link>
            )}
          </div>
        </Card>
      )}

      {conflicts.length > 0 && (
        <section className="rounded-3xl border border-warning/30 bg-warning/5 p-4 space-y-1.5" aria-label="Choques de horario">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <AlertTriangle size={17} className="text-warning" />
            {conflicts.length === 1 ? 'Un choque de horario' : `${conflicts.length} choques de horario`}
          </p>
          <ul className="text-sm text-ink-2 space-y-0.5">
            {conflicts.slice(0, 4).map((c) => (
              <li key={`${c.a.id}-${c.b.id}`}>
                {dayName(c.date)}: {c.a.title} ({c.a.start}–{c.a.end}) y {c.b.title} ({c.b.start}–{c.b.end})
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* CELULAR: un día a la vez */}
      <div className="lg:hidden space-y-4">
        <nav aria-label="Días de la semana" className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            const active = d === sel;
            const load = loads.get(d)!;
            const busy = itemsOf(d).length + tasksOf(d).length;
            return (
              <Link
                key={d}
                href={`/semana?semana=${weekStart}&dia=${d}`}
                aria-current={active ? 'date' : undefined}
                aria-label={`${longDateLabel(d)}${busy ? `, ${busy} cosas` : ''}`}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 min-h-16 rounded-2xl border transition-colors',
                  active ? 'bg-ink text-bg border-ink' : 'bg-surface border-line text-ink-2',
                  d === today && !active && 'border-accent/60'
                )}
              >
                <span className={cn('text-xs font-medium', active ? 'text-bg/70' : 'text-ink-3')}>{DAY_LETTERS[i]}</span>
                <span className="text-[17px] font-semibold tabular-nums">{Number(d.slice(8))}</span>
                <span
                  className={cn('h-1.5 w-1.5 rounded-full', busy ? LOAD_DOT[load.status] : 'bg-transparent')}
                  aria-hidden
                />
              </Link>
            );
          })}
        </nav>

        <Card as="section" aria-label={longDateLabel(sel)} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">{longDateLabel(sel)}</h2>
            {itemsOf(sel).length > 0 && <LoadLine load={loads.get(sel)!} />}
          </div>
          {itemsOf(sel).length === 0 && tasksOf(sel).length === 0 ? (
            <p className="text-[15px] text-ink-2">Día libre. Así también está bien.</p>
          ) : (
            <>
              {itemsOf(sel).length > 0 && <AgendaList items={itemsOf(sel)} now={sel === today ? now : null} />}
              {tasksOf(sel).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-ink-3 px-1 mb-1">Tareas del día</p>
                  <ul className="divide-y divide-line">
                    {tasksOf(sel).map((t) => (
                      <TaskRow key={t.id} task={t} today={today} variant={t.area === 'trabajo' ? 'work' : 'default'} />
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          {ready && <AddBlockButton initial={{ date: sel }} className="w-full" />}
        </Card>
      </div>

      {/* ESCRITORIO: la semana completa */}
      <div className="hidden lg:grid grid-cols-7 gap-2">
        {days.map((d) => {
          const load = loads.get(d)!;
          const items = itemsOf(d);
          const dayTasks = tasksOf(d);
          return (
            <section
              key={d}
              aria-label={longDateLabel(d)}
              className={cn('min-w-0 rounded-3xl border bg-surface p-2.5 space-y-2', d === today ? 'border-accent/50' : 'border-line')}
            >
              <header className="flex items-center justify-between px-1">
                <span>
                  <span className="block text-xs font-medium text-ink-3">{dayName(d)}</span>
                  <span className="block text-lg font-semibold text-ink tabular-nums">{Number(d.slice(8))}</span>
                </span>
                {items.length > 0 && (
                  <span
                    className={cn('h-2 w-2 rounded-full', LOAD_DOT[load.status])}
                    title={`${Math.round(Math.max(load.freeRatio, load.workRatio) * 100)}% planificado`}
                  />
                )}
              </header>
              <AgendaList items={items} compact />
              {dayTasks.length > 0 && (
                <ul className="space-y-1 px-1">
                  {dayTasks.map((t) => (
                    <li key={t.id} className="text-xs text-ink-2 truncate">
                      ☐ {t.title}
                    </li>
                  ))}
                </ul>
              )}
              {ready && <AddBlockButton initial={{ date: d }} label="Agregar" className="w-full min-h-9 px-2 text-xs" />}
            </section>
          );
        })}
      </div>

      {unscheduled.length > 0 && (
        <Card as="section" aria-label="Esta semana, sin día" className="space-y-1">
          <h2 className="text-[15px] font-semibold text-ink">Esta semana, sin día fijo</h2>
          <ul className="divide-y divide-line">
            {unscheduled.map((t) => (
              <TaskRow key={t.id} task={t} today={today} variant={t.area === 'trabajo' ? 'work' : 'default'} />
            ))}
          </ul>
        </Card>
      )}

      {ready && routinesCount === 0 && (
        <p className="text-sm text-ink-3 text-center">
          ¿Tienes horarios fijos (gym, trabajo)? <Link href="/semana/rutinas" className="text-accent">Crea tus rutinas</Link> y se repetirán solas.
        </p>
      )}
    </div>
  );
}
