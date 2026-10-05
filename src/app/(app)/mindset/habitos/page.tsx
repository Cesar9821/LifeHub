import { ListChecks, Ban, Check } from 'lucide-react';
import { getHabitsWithStatus } from '@/services/mindset';
import HabitForm from './habit-form';
import HabitItem, { type HabitItemData } from './habit-item';

export default async function HabitosPage() {
  const habits = await getHabitsWithStatus();

  const build = habits.filter((h) => h.kind === 'build');
  const brk = habits.filter((h) => h.kind === 'break');

  return (
    <div className="space-y-8 pb-20 max-w-5xl">
      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-line-strong bg-surface w-fit">
          <ListChecks size={13} className="text-violet-400" />
          <span className="text-xs font-bold text-ink-2 tracking-wide">
            Tus compromisos
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-semibold text-ink tracking-tight leading-none">
          Hábitos<span className="text-violet-400">.</span>
        </h1>
        <p className="text-ink-3 font-bold text-xs tracking-wide max-w-md">
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
  habits: HabitItemData[];
  empty: string;
}) {
  return (
    <div className="bg-surface border border-line rounded-3xl p-6">
      <div className="flex items-center gap-2 mb-6">
        {icon}
        <h2 className="text-sm font-semibold text-ink tracking-wide">{title}</h2>
        <span className="text-xs font-bold text-ink-3">({habits.length})</span>
      </div>

      {habits.length === 0 ? (
        <p className="text-sm text-ink-3 font-medium">{empty}</p>
      ) : (
        <div className="space-y-2">
          {habits.map((h) => (
            <HabitItem key={h.id} habit={h} />
          ))}
        </div>
      )}
    </div>
  );
}
