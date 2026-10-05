import Link from 'next/link';
import { Flame, Target, TrendingUp, ListChecks, ArrowRight, Swords } from 'lucide-react';
import { getHabitsWithStatus, getTodayLog, summarizeHabits } from '@/services/mindset';
import { phraseOfDay } from '@/lib/mindset-phrases';
import HabitCard from './habit-card';
import DailyPanel from './daily-panel';
import FrogCard from './frog-card';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export default async function MindsetTodayPage() {
  const [habits, todayLog] = await Promise.all([
    getHabitsWithStatus(),
    getTodayLog(),
  ]);

  const summary = summarizeHabits(habits);

  const now = new Date();
  const dateLabel = `${DAYS[now.getDay()]} ${now.getDate()} de ${MONTHS[now.getMonth()]}`;
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  const allDone = summary.totalHabits > 0 && summary.pendingToday === 0;
  const phrase = phraseOfDay();

  return (
    <div className="space-y-8 pb-20 max-w-6xl">
      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-line-strong bg-surface w-fit">
          <Flame size={13} className="text-orange-400" />
          <span className="text-xs font-bold text-ink-2 tracking-wide">
            {dateLabel}
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-semibold text-ink tracking-tight leading-none">
          {greeting}<span className="text-violet-400">.</span>
        </h1>
        {summary.totalHabits > 0 && (
          <p className="text-ink-3 font-bold text-xs tracking-wide">
            {allDone
              ? 'Día completo. Así se construye.'
              : `${summary.pendingToday} pendiente${summary.pendingToday !== 1 ? 's' : ''} para cerrar el día`}
          </p>
        )}
      </div>

      {/* FRASE DEL DÍA + LA FORJA */}
      <Link
        href="/mindset/forja"
        className="group flex items-center gap-4 bg-gradient-to-br from-violet-600/10 to-transparent border border-violet-500/15 rounded-3xl p-5 hover:border-violet-500/30 transition-all"
      >
        <div className="h-11 w-11 shrink-0 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Swords size={18} className="text-violet-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink leading-snug line-clamp-2">
            &ldquo;{phrase.text}&rdquo;
          </p>
          <p className="text-xs font-semibold text-violet-400 tracking-wide mt-0.5">
            La Forja · {phrase.source}
          </p>
        </div>
        <ArrowRight size={16} className="text-ink-3 group-hover:text-violet-400 group-hover:translate-x-1 transition-all shrink-0" />
      </Link>

      {/* LA RANA DEL DÍA */}
      <FrogCard topTask={todayLog?.top_task ?? null} done={todayLog?.top_task_done ?? false} />

      {/* MÉTRICAS */}
      {summary.totalHabits > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatBox
            icon={<Target size={15} className="text-violet-400" />}
            label="Hoy"
            value={`${summary.doneToday}/${summary.totalHabits}`}
            accent={allDone ? 'text-violet-400' : 'text-ink'}
          />
          <StatBox
            icon={<Flame size={15} className="text-orange-400" />}
            label="Mejor racha"
            value={String(summary.longestStreak)}
            accent="text-orange-400"
          />
          <StatBox
            icon={<TrendingUp size={15} className="text-emerald-400" />}
            label="Semana"
            value={`${summary.weekPercent}%`}
            accent="text-emerald-400"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* HÁBITOS DE HOY */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink tracking-wide">
              Hábitos de hoy
            </h2>
            <Link
              href="/mindset/habitos"
              className="text-xs font-semibold text-violet-400 hover:text-violet-300 tracking-wide transition-colors"
            >
              Gestionar
            </Link>
          </div>

          {habits.length === 0 ? (
            <div className="bg-surface border border-dashed border-line-strong rounded-3xl p-10 text-center">
              <ListChecks size={30} className="text-slate-700 mx-auto mb-4" />
              <p className="text-ink-2 font-bold mb-2">Aún no tienes hábitos</p>
              <p className="text-xs text-ink-3 font-medium mb-6 max-w-xs mx-auto">
                Define los que quieres sostener. La constancia se construye un día a la vez.
              </p>
              <Link
                href="/mindset/habitos"
                className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-semibold text-xs tracking-wide hover:bg-slate-200 transition-all active:scale-95"
              >
                Crear el primero <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            habits.map((h) => (
              <HabitCard
                key={h.id}
                id={h.id}
                name={h.name}
                description={h.description}
                kind={h.kind}
                doneToday={h.doneToday}
                streak={h.streak}
                bestStreak={h.bestStreak}
                lastWeek={h.lastWeek}
              />
            ))
          )}
        </div>

        {/* REGISTRO DIARIO */}
        <DailyPanel
          sleepHours={todayLog?.sleep_hours ?? null}
          mood={todayLog?.mood ?? null}
          energy={todayLog?.energy ?? null}
          waterMl={todayLog?.water_ml ?? 0}
          weightKg={todayLog?.weight_kg ?? null}
          reflection={todayLog?.reflection ?? null}
        />
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-3 sm:p-4">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-xs font-semibold text-ink-3 tracking-wide">
          {label}
        </span>
      </div>
      <p className={`text-xl sm:text-2xl font-semibold tabular-nums leading-none ${accent}`}>{value}</p>
    </div>
  );
}
