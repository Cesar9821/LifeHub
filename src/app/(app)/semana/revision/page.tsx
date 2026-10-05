import Link from 'next/link';
import { ArrowLeft, Briefcase, Dumbbell, Repeat, Users, Wallet, Zap } from 'lucide-react';
import { formatCLP, todayStr } from '@/lib/format';
import { durationLabel, isDateStr, weekRangeLabel, weekStartOf } from '@/lib/planning/dates';
import { loadWeekReview } from '@/services/review';
import { loadWeeklyPlan } from '@/services/planning';
import { loadFinanceSnapshot } from '@/services/finance-snapshot';
import { Card, PageHeader } from '@/components/ui/card';
import { ReviewForm } from '@/components/planning/review-form';
import { loadWheelWeek, WELLBEING_SQL_MISSING } from '@/services/wellbeing';
import { WHEEL_LABEL, weakestArea, wheelAverage, wheelFilled } from '@/lib/wellbeing';
import { WheelBars, WheelChart } from '@/components/wellbeing/wheel-chart';
import { WheelForm } from '@/components/wellbeing/wheel-form';

export const dynamic = 'force-dynamic';

function Metric({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-3">
      <span className="h-9 w-9 shrink-0 rounded-xl bg-surface-3 inline-flex items-center justify-center text-ink-2">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm text-ink-3">{title}</p>
        <div className="text-[15px] text-ink">{children}</div>
      </div>
    </div>
  );
}

/** Revisión semanal: breve. Métricas simples, qué mejorar y la prioridad que viene. */
export default async function RevisionPage({ searchParams }: { searchParams: Promise<{ semana?: string }> }) {
  const { semana } = await searchParams;
  const weekStart = weekStartOf(isDateStr(semana) ? semana : todayStr());
  const [r, plan, finance, wheel] = await Promise.all([
    loadWeekReview(weekStart),
    loadWeeklyPlan(weekStart),
    loadFinanceSnapshot().catch(() => null),
    loadWheelWeek(weekStart),
  ]);
  const objDone = plan.objectives.filter((o) => o.done).length;
  const filled = wheelFilled(wheel.self);
  const weakest = filled ? weakestArea(wheel.self) : null;
  const avg = filled ? wheelAverage(wheel.self) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link href={`/semana?semana=${weekStart}`} className="inline-flex items-center gap-1.5 min-h-11 text-sm font-medium text-ink-2 hover:text-ink">
        <ArrowLeft size={16} /> Semana
      </Link>
      <PageHeader title="Revisión semanal" subtitle={`${weekRangeLabel(weekStart)} · dos minutos`} />

      {plan.objectives.length > 0 && (
        <Card as="section" className="space-y-2">
          <p className="text-[15px] font-semibold text-ink">
            Objetivos: {objDone} de {plan.objectives.length}
          </p>
          <ul className="space-y-1">
            {plan.objectives.map((o) => (
              <li key={o.id} className={o.done ? 'text-ink-3 line-through' : 'text-ink'}>
                {o.done ? '✓ ' : '· '}
                {o.title}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card as="section" className="divide-y divide-line py-2">
        <Metric icon={<Briefcase size={17} />} title="Trabajo">
          {r.work.done} completadas · {r.work.open} pendientes
          {r.work.waiting > 0 && ` · ${r.work.waiting} esperando`}
        </Metric>
        <Metric icon={<Dumbbell size={17} />} title="Salud">
          {r.health.trainings > 0 || r.health.trainingsPlanned > 0
            ? `${r.health.trainings} entrenamientos marcados${r.health.trainingsPlanned ? ` de ${r.health.trainingsPlanned} planificados` : ''}`
            : 'Sin entrenamientos registrados'}
          {r.health.avgSleep !== null && ` · sueño promedio ${r.health.avgSleep} h`}
        </Metric>
        <Metric icon={<Users size={17} />} title="Familia">
          {r.family.plannedMinutes > 0 ? `${durationLabel(r.family.plannedMinutes)} planificadas` : 'Sin tiempo familiar agendado'}
          {r.family.tasksDone > 0 && ` · ${r.family.tasksDone} tareas hechas`}
        </Metric>
        <Metric icon={<Repeat size={17} />} title="Hábitos">
          {r.habits.target > 0 ? `${r.habits.done} de ${r.habits.target} (${Math.round((r.habits.done / r.habits.target) * 100)}%)` : 'Sin hábitos activos'}
        </Metric>
        <Metric icon={<Wallet size={17} />} title="Finanzas del mes">
          {finance?.ready
            ? `Disponible ${formatCLP(finance.money.available)} · margen libre ${formatCLP(finance.money.margin)}`
            : 'Plan del hogar sin cargar'}
        </Metric>
        <Metric icon={<Zap size={17} />} title="Proyectos">
          {r.projects.length === 0
            ? 'Sin proyectos activos'
            : r.projects.map((p) => (
                <span key={p.name} className="block">
                  {p.name}: {p.minutes > 0 ? `${durationLabel(p.minutes)} de avance` : 'sin tiempo esta semana'}
                  {p.tasksDone > 0 && ` · ${p.tasksDone} tareas`}
                </span>
              ))}
        </Metric>
      </Card>

      <Card as="section" aria-labelledby="rueda" className="space-y-4">
        <div>
          <h2 id="rueda" className="text-[16px] font-semibold text-ink">
            Rueda de la vida
          </h2>
          <p className="text-sm text-ink-2">Ponle nota a cada área: ¿cómo la sientes esta semana? Así ves qué se está quedando atrás.</p>
        </div>
        {!wheel.ready ? (
          <p className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm text-ink-2">{WELLBEING_SQL_MISSING}</p>
        ) : (
          <>
            {filled && (
              <>
                <WheelChart self={wheel.self} previous={wheel.previous} />
                {weakest && (
                  <p className="rounded-2xl bg-surface-2 p-3 text-[15px] text-ink">
                    Promedio <span className="font-semibold tabular-nums">{avg}</span>. La que más necesita atención:{' '}
                    <span className="font-semibold">{WHEEL_LABEL[weakest]}</span>. ¿Una acción chica para ella la próxima semana?
                  </p>
                )}
                <WheelBars self={wheel.self} activity={wheel.activity} />
                <p className="text-xs text-ink-3">
                  La actividad se calcula con lo que registraste: tareas hechas, prioridades, hábitos, enfoque, cierres del día, tareas y eventos del
                  hogar y movimientos.
                </p>
              </>
            )}
            <details open={!filled} className="group">
              <summary className="cursor-pointer list-none min-h-11 inline-flex items-center text-sm font-medium text-accent">
                {filled ? 'Cambiar mis notas' : 'Poner mis notas'}
              </summary>
              <div className="pt-2">
                <WheelForm weekStart={weekStart} initial={wheel.self} />
              </div>
            </details>
          </>
        )}
      </Card>

      <Card as="section" className="space-y-3">
        <h2 className="text-[16px] font-semibold text-ink">Para la próxima semana</h2>
        <ReviewForm weekStart={weekStart} rating={plan.review_rating} improve={plan.review_improve} nextPriority={plan.review_next_priority} />
      </Card>
    </div>
  );
}
