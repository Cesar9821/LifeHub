'use client';

import { Check, Flame, Ban } from 'lucide-react';
import { toggleHabit } from './actions';

export default function HabitCard({
  id,
  name,
  description,
  kind,
  doneToday,
  streak,
  bestStreak,
  lastWeek,
}: {
  id: string;
  name: string;
  description: string | null;
  kind: 'build' | 'break';
  doneToday: boolean;
  streak: number;
  bestStreak: number;
  lastWeek: boolean[];
}) {
  const isBreak = kind === 'break';

  return (
    <form action={toggleHabit}>
      <input type="hidden" name="habit_id" value={id} />
      <input type="hidden" name="done" value={String(doneToday)} />
      <button
        type="submit"
        className={`w-full text-left rounded-[1.75rem] p-5 border transition-all active:scale-[0.99] group ${
          doneToday
            ? 'bg-violet-500/10 border-violet-500/30'
            : 'bg-slate-900/40 border-white/5 hover:border-white/15'
        }`}
      >
        <div className="flex items-center gap-4">
          {/* Check */}
          <div
            className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
              doneToday
                ? 'bg-violet-500 border-violet-400 text-white'
                : 'bg-black/30 border-white/10 text-slate-600 group-hover:border-violet-500/40 group-hover:text-violet-400'
            }`}
          >
            {doneToday ? <Check size={22} strokeWidth={3} /> : isBreak ? <Ban size={20} /> : <Check size={20} />}
          </div>

          {/* Texto */}
          <div className="flex-1 min-w-0">
            <p
              className={`font-black text-base truncate ${
                doneToday ? 'text-white' : 'text-slate-200'
              }`}
            >
              {name}
            </p>
            {description && (
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {description}
              </p>
            )}
          </div>

          {/* Racha */}
          <div className="flex flex-col items-end shrink-0">
            <div
              className={`flex items-center gap-1 ${
                streak > 0 ? 'text-orange-400' : 'text-slate-600'
              }`}
            >
              <Flame size={15} className={streak > 0 ? 'fill-orange-400/20' : ''} />
              <span className="font-black font-mono text-lg leading-none">{streak}</span>
            </div>
            {bestStreak > 0 && (
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mt-1">
                Récord {bestStreak}
              </span>
            )}
          </div>
        </div>

        {/* Últimos 7 días */}
        <div className="flex items-center gap-1.5 mt-4 pl-16">
          {lastWeek.map((done, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                done ? 'bg-violet-500' : 'bg-white/5'
              }`}
            />
          ))}
        </div>
      </button>
    </form>
  );
}
