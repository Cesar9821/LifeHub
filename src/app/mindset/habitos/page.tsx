import { ListChecks, Trash2, Flame, Ban, Check, Power } from 'lucide-react';
import { getHabitsWithStatus } from '@/services/mindset';
import { deleteHabit, toggleHabitActive } from '../actions';
import HabitForm from './habit-form';

export default async function HabitosPage() {
  const habits = await getHabitsWithStatus();

  const build = habits.filter((h) => h.kind === 'build');
  const brk = habits.filter((h) => h.kind === 'break');

  return (
    <div className="space-y-8 pb-20 max-w-5xl">
      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-md w-fit">
          <ListChecks size={13} className="text-violet-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Tus compromisos
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic leading-none">
          Hábitos<span className="text-violet-400">.</span>
        </h1>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] max-w-md">
          Define lo que sostienes cada día. Pocos y firmes es mejor que muchos y flojos.
        </p>
      </div>

      <HabitForm />

      {/* LISTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HabitList
          title="Construir"
          icon={<Check size={16} className="text-violet-400" />}
          habits={build}
          empty="Aún no defines hábitos que quieras construir."
        />
        <HabitList
          title="Evitar"
          icon={<Ban size={16} className="text-rose-400" />}
          habits={brk}
          empty="Aún no defines hábitos que quieras evitar."
        />
      </div>
    </div>
  );
}

function HabitList({
  title,
  icon,
  habits,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  habits: {
    id: string;
    name: string;
    description: string | null;
    frequency: string;
    target_per_week: number;
    streak: number;
    bestStreak: number;
    is_active: boolean;
  }[];
  empty: string;
}) {
  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-6">
        {icon}
        <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">{title}</h2>
        <span className="text-xs font-bold text-slate-600">({habits.length})</span>
      </div>

      {habits.length === 0 ? (
        <p className="text-sm text-slate-600 font-medium">{empty}</p>
      ) : (
        <div className="space-y-2">
          {habits.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between gap-3 bg-black/20 border border-white/5 rounded-xl px-4 py-3 group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-200 truncate">{h.name}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {h.frequency === 'daily'
                    ? 'Diario'
                    : `${h.target_per_week}× por semana`}
                  {h.bestStreak > 0 && ` · récord ${h.bestStreak}`}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div
                  className={`flex items-center gap-1 ${
                    h.streak > 0 ? 'text-orange-400' : 'text-slate-600'
                  }`}
                >
                  <Flame size={13} />
                  <span className="font-black font-mono text-sm">{h.streak}</span>
                </div>

                <form action={toggleHabitActive}>
                  <input type="hidden" name="id" value={h.id} />
                  <input type="hidden" name="is_active" value={String(h.is_active)} />
                  <button
                    type="submit"
                    title="Pausar"
                    className="text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    <Power size={14} />
                  </button>
                </form>

                <form action={deleteHabit}>
                  <input type="hidden" name="id" value={h.id} />
                  <button
                    type="submit"
                    title="Eliminar"
                    className="text-slate-600 hover:text-rose-400 transition-colors opacity-60 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
