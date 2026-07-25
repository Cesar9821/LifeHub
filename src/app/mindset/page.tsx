import Link from 'next/link';
import { Flame, Target, TrendingUp, ListChecks, ArrowRight } from 'lucide-react';
import { getHabitsWithStatus, getTodayLog, summarizeHabits } from '@/services/mindset';
import HabitCard from './habit-card';
import DailyPanel from './daily-panel';

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

  return (
    <div className="space-y-8 pb-20 max-w-6xl">
      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-md w-fit">
          <Flame size={13} className="text-orange-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            {dateLabel}
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic leading-none">
          {greeting}<span className="text-violet-400">.</span>
        </h1>
        {summary.totalHabits > 0 && (
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">
            {allDone
              ? 'Día completo. Así se construye.'
              : `${summary.pendingToday} pendiente${summary.pendingToday !== 1 ? 's' : ''} para cerrar el día`}
          </p>
        )}
      </div>

      {/* MÉTRICAS */}
      {summary.totalHabits > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatBox
            icon={<Target size={15} className="text-violet-400" />}
            label="Hoy"
            value={`${summary.doneToday}/${summary.totalHabits}`}
            accent={allDone ? 'text-violet-400' : 'text-white'}
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
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
              Hábitos de hoy
            </h2>
            <Link
              href="/mindset/habitos"
              className="text-[10px] font-black text-violet-400 hover:text-violet-300 uppercase tracking-wider transition-colors"
            >
              Gestionar
            </Link>
          </div>

          {habits.length === 0 ? (
            <div className="bg-slate-900/20 border border-dashed border-white/10 rounded-[2rem] p-10 text-center">
              <ListChecks size={30} className="text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-bold mb-2">Aún no tienes hábitos</p>
              <p className="text-xs text-slate-600 font-medium mb-6 max-w-xs mx-auto">
                Define los que quieres sostener. La constancia se construye un día a la vez.
              </p>
              <Link
                href="/mindset/habitos"
                className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-95"
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
    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-3 sm:p-4 backdrop-blur-xl">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.15em]">
          {label}
        </span>
      </div>
      <p className={`text-xl sm:text-2xl font-black font-mono leading-none ${accent}`}>{value}</p>
    </div>
  );
}
