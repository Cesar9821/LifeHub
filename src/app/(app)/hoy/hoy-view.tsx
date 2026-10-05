import Link from 'next/link';
import { ArrowRight, Briefcase, CalendarCheck, Inbox, Repeat, Sparkles, Wallet } from 'lucide-react';
import { formatCLP } from '@/lib/format';
import { cn } from '@/lib/utils';
import { greetingFor, isoDow, longDateLabel, weekStartOf } from '@/lib/planning/dates';
import { isForToday, isOverdue } from '@/lib/planning/tasks';
import { suggestPriorities } from '@/lib/planning/priorities';
import { asArea } from '@/lib/planning/areas';
import type { Priority, Task } from '@/services/tasks';
import type { AgendaItem, WeeklyPlan } from '@/services/planning';
import type { HabitsToday } from '@/services/habits';
import type { FinanceSnapshot } from '@/services/finance-snapshot';
import { toggleHabit } from '@/app/(app)/mindset/actions';
import { Card, SectionHeader } from '@/components/ui/card';
import { CheckButton } from '@/components/ui/check-button';
import { Chip } from '@/components/ui/chip';
import { AgendaList } from '@/components/planning/agenda-list';
import { Priorities, type Suggestion } from '@/components/planning/priorities';
import { QuickCapture } from '@/components/planning/quick-capture';
import { PlanningSetupCard } from '@/components/planning/setup-card';
import { TaskRow } from '@/components/planning/task-row';

export interface HoyData {
  today: string;
  now: string;
  name: string;
  ready: boolean;
  tasks: Task[];
  priorities: Priority[];
  frog: { title: string; done: boolean } | null;
  agenda: AgendaItem[];
  habits: HabitsToday;
  finance: FinanceSnapshot | null;
  weekPlan: WeeklyPlan | null;
}

/** Pantalla Hoy (solo presentación: los datos llegan listos). */
export function HoyView({ today, now, name, ready, tasks, priorities, frog, agenda, habits, finance, weekPlan }: HoyData) {
  const weekStart = weekStartOf(today);
  const inboxCount = tasks.filter((t) => t.status === 'inbox').length;
  const todayTasks = tasks.filter((t) => isForToday(t, today));
  const workToday = todayTasks.filter((t) => t.area === 'trabajo');
  const waiting = tasks.filter((t) => t.area === 'trabajo' && t.status === 'esperando');
  // Las tareas con hora ya aparecen en la agenda.
  const otherToday = todayTasks.filter((t) => t.area !== 'trabajo' && !(t.due_date === today && t.due_time));

  const chosen = priorities.map((p) => p.task_id).filter(Boolean) as string[];
  const suggestions: Suggestion[] = suggestPriorities(tasks, today, chosen, 3).map((t) => ({
    taskId: t.id,
    title: t.title,
    hint: isOverdue(t, today) ? 'atrasada' : t.area === 'trabajo' ? 'trabajo' : null,
  }));
  if (frog && !frog.done && !priorities.some((p) => p.title === frog.title)) {
    suggestions.unshift({ taskId: null, title: frog.title, hint: 'tu Rana' });
  }

  const dow = isoDow(today);
  const showPlanCard = ready && weekPlan && !weekPlan.planned_at && dow <= 2;
  const showReviewCard = ready && weekPlan && !weekPlan.reviewed_at && dow >= 6;
  const pendingHabits = habits.habits.filter((h) => h.pendingToday || h.doneToday);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. FECHA Y SALUDO */}
      <header className="flex items-start justify-between gap-4 pt-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-3">{longDateLabel(today)}</p>
          <h1 className="mt-0.5 text-[26px] sm:text-[28px] leading-tight font-semibold tracking-tight text-ink">
            {greetingFor(now)}
            {name ? `, ${name}` : ''} 👋
          </h1>
          {weekPlan?.focus && (
            <p className="mt-1 text-[15px] text-ink-2">
              Foco de la semana: <span className="text-ink">{weekPlan.focus}</span>
            </p>
          )}
        </div>
        <Link
          href="/capturas"
          aria-label={`Capturas: ${inboxCount} sin ordenar`}
          className="relative shrink-0 h-11 w-11 inline-flex items-center justify-center rounded-full bg-surface border border-line text-ink-2 hover:text-ink"
        >
          <Inbox size={20} />
          {inboxCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-accent text-bg text-xs font-semibold inline-flex items-center justify-center">
              {inboxCount}
            </span>
          )}
        </Link>
      </header>

      {!ready && <PlanningSetupCard />}

      {showPlanCard && (
        <Link href={`/semana/planificar?semana=${weekStart}`} className="flex items-center gap-4 rounded-3xl border border-accent/30 bg-accent/5 p-4 hover:bg-accent/10">
          <CalendarCheck size={22} className="text-accent shrink-0" />
          <span className="flex-1">
            <span className="block text-[15px] font-semibold text-ink">Planifica tu semana</span>
            <span className="block text-sm text-ink-2">Cinco minutos ahora te ahorran varias decisiones después.</span>
          </span>
          <ArrowRight size={18} className="text-ink-3" />
        </Link>
      )}
      {showReviewCard && (
        <Link href={`/semana/revision?semana=${weekStart}`} className="flex items-center gap-4 rounded-3xl border border-accent/30 bg-accent/5 p-4 hover:bg-accent/10">
          <Sparkles size={22} className="text-accent shrink-0" />
          <span className="flex-1">
            <span className="block text-[15px] font-semibold text-ink">Revisión semanal</span>
            <span className="block text-sm text-ink-2">Mira cómo te fue y elige la prioridad de la próxima semana.</span>
          </span>
          <ArrowRight size={18} className="text-ink-3" />
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          {/* 2. LO IMPORTANTE */}
          <Card as="section" aria-labelledby="importante">
            <h2 id="importante" className="text-lg font-semibold text-ink mb-3">
              🔥 Lo importante
            </h2>
            {ready ? (
              <Priorities
                items={priorities.map((p) => ({ id: p.id, position: p.position, title: p.title, area: asArea(p.area), done: p.done }))}
                suggestions={suggestions}
              />
            ) : (
              <p className="text-[15px] text-ink-2">Disponible cuando actives la planificación.</p>
            )}
          </Card>

          {/* 3. MI DÍA */}
          <Card as="section" aria-labelledby="mi-dia">
            <SectionHeader title="🕐 Mi día" href={`/semana?dia=${today}`} action="Semana" className="-mt-2 mb-1" />
            <h2 id="mi-dia" className="sr-only">
              Mi día
            </h2>
            {agenda.length === 0 && otherToday.length === 0 ? (
              <div className="py-4 text-center space-y-1">
                <p className="text-[15px] font-medium text-ink">Tu día está limpio.</p>
                <p className="text-sm text-ink-2">
                  <Link href="/semana" className="text-accent">Planifica tu semana</Link> o agrega algo con el botón +.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {agenda.length > 0 && <AgendaList items={agenda} now={now} />}
                {otherToday.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-ink-3 px-1 mb-1">Tareas para hoy</p>
                    <ul className="divide-y divide-line">
                      {otherToday.map((t) => (
                        <TaskRow key={t.id} task={t} today={today} />
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6 min-w-0">
          {/* 4. TRABAJO */}
          <Card as="section">
            <SectionHeader title="Trabajo" icon={<Briefcase size={18} />} href="/trabajo" className="-mt-2" />
            {workToday.length === 0 ? (
              <p className="text-[15px] text-ink-2">
                {waiting.length > 0 ? 'Nada pendiente para hoy.' : 'Sin pendientes de trabajo para hoy.'}
              </p>
            ) : (
              <>
                <p className="text-[15px] text-ink">
                  <span className="text-2xl font-semibold tabular-nums">{workToday.length}</span>{' '}
                  {workToday.length === 1 ? 'pendiente hoy' : 'pendientes hoy'}
                </p>
                <ul className="mt-2 space-y-1">
                  {workToday.slice(0, 3).map((t) => (
                    <li key={t.id} className="flex items-center gap-2 text-[15px] text-ink-2 min-w-0">
                      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', isOverdue(t, today) ? 'bg-danger' : 'bg-area-trabajo')} />
                      <span className="truncate">{t.title}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {waiting.length > 0 && (
              <p className="mt-3">
                <Chip tone="warning">📌 {waiting.length} esperando a otros</Chip>
              </p>
            )}
          </Card>

          {/* 5. HÁBITOS */}
          <Card as="section">
            <SectionHeader
              title={habits.dueCount > 0 ? `Hábitos · ${habits.doneCount}/${habits.dueCount}` : 'Hábitos'}
              icon={<Repeat size={18} />}
              href="/habitos"
              className="-mt-2"
            />
            {habits.habits.length === 0 ? (
              <p className="text-[15px] text-ink-2">
                <Link href="/habitos" className="text-accent">Crea tus primeros hábitos.</Link> Pocos y simples.
              </p>
            ) : pendingHabits.length === 0 ? (
              <p className="text-[15px] text-ink-2">Hoy no te toca ninguno. Descansa.</p>
            ) : (
              <ul className="space-y-0.5">
                {pendingHabits.slice(0, 6).map((h) => (
                  <li key={h.id} className="flex items-center gap-3 min-h-11">
                    <form action={toggleHabit}>
                      <input type="hidden" name="habit_id" value={h.id} />
                      <input type="hidden" name="done" value={String(h.doneToday)} />
                      <CheckButton done={h.doneToday} label={h.name} />
                    </form>
                    <span className={cn('flex-1 min-w-0 truncate text-[15px]', h.doneToday ? 'text-ink-3 line-through' : 'text-ink')}>
                      {h.name}
                    </span>
                    <span className="text-xs text-ink-3 tabular-nums shrink-0">
                      {h.weekDone}/{h.weekTarget} sem.
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* 6. FINANZAS */}
          <Card as="section">
            <SectionHeader title="Finanzas" icon={<Wallet size={18} />} href="/finanzas" className="-mt-2" />
            {!finance?.ready ? (
              <p className="text-[15px] text-ink-2">
                <Link href="/finanzas" className="text-accent">Carga el plan del hogar</Link> para ver cómo va el mes.
              </p>
            ) : (
              <>
                <p className="text-sm text-ink-3">Disponible del mes</p>
                <p className={cn('text-3xl font-semibold tabular-nums tracking-tight', finance.money.available >= 0 ? 'text-ink' : 'text-danger')}>
                  {formatCLP(finance.money.available)}
                </p>
                <p className="mt-1 text-sm text-ink-2">
                  Comprometido {formatCLP(finance.money.committed)} · margen libre{' '}
                  <span className={finance.money.margin >= 0 ? 'text-ink' : 'text-danger'}>{formatCLP(finance.money.margin)}</span>
                </p>
                {finance.dueNow.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {finance.dueNow.slice(0, 3).map((d) => (
                      <li key={d.label} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate text-ink">{d.label}</span>
                        <Chip tone={d.state === 'vencido' ? 'danger' : 'warning'}>
                          {d.state === 'vencido' ? 'Vencida' : 'Vence hoy'} · {formatCLP(d.amount)}
                        </Chip>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href="/finanzas#puedo-gastar"
                  className="mt-3 inline-flex items-center gap-1 min-h-11 text-sm font-medium text-accent"
                >
                  ¿Puedo gastar esto? <ArrowRight size={14} />
                </Link>
              </>
            )}
          </Card>

          {/* 7. CAPTURA RÁPIDA */}
          <Card as="section">
            <h2 className="text-[15px] font-semibold text-ink mb-3">📥 Captura rápida</h2>
            {ready ? <QuickCapture /> : <p className="text-sm text-ink-2">Disponible cuando actives la planificación.</p>}
            {inboxCount > 0 && (
              <Link href="/capturas" className="mt-2 inline-flex items-center gap-1 min-h-11 text-sm text-ink-2 hover:text-ink">
                {inboxCount} {inboxCount === 1 ? 'captura' : 'capturas'} por ordenar <ArrowRight size={14} />
              </Link>
            )}
          </Card>
        </div>
      </div>

    </div>
  );
}
