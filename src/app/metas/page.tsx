import { Target, Archive, RotateCcw, Trash2 } from 'lucide-react';
import { getGoals, getArchivedGoals, getLinkableSavings, summarizeGoals } from '@/services/metas';
import { setGoalStatus, deleteGoal } from './actions';
import GoalForm from './goal-form';
import GoalCard from './goal-card';

export const dynamic = 'force-dynamic';

export default async function MetasPage() {
  const [goals, archived, savings] = await Promise.all([getGoals(), getArchivedGoals(), getLinkableSavings()]);
  const summary = summarizeGoals(goals);

  const active = goals.filter((g) => g.status === 'active');
  const done = goals.filter((g) => g.status === 'done');

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-10 pb-20">
      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 w-fit">
          <Target size={12} className="text-amber-400" />
          <span className="text-[9px] md:text-[10px] font-bold text-amber-400/80 uppercase tracking-[0.2em]">
            Objetivos y proyectos
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic">
          Metas<span className="text-amber-500">.</span>
        </h1>
      </div>

      {/* RESUMEN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatTile label="Activas" value={String(summary.active)} accent="text-white" />
        <StatTile label="Progreso medio" value={`${summary.avgProgress}%`} accent="text-amber-400" />
        <StatTile label="Completadas" value={String(summary.done)} accent="text-emerald-400" />
        <StatTile
          label="Vencidas"
          value={String(summary.overdue)}
          accent={summary.overdue > 0 ? 'text-rose-400' : 'text-slate-500'}
        />
      </div>

      {/* LOGROS */}
      {summary.done > 0 && (
        <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-[1.75rem] p-5 flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <p className="text-sm font-black text-white">
            Llevas {summary.done} meta{summary.done !== 1 ? 's' : ''} cumplida{summary.done !== 1 ? 's' : ''}. Cada una te forjó. Sigue.
          </p>
        </div>
      )}

      {/* FORMULARIO */}
      <GoalForm savings={savings} />

      {/* LISTA ACTIVAS */}
      {active.length === 0 && done.length === 0 ? (
        <div className="border-2 border-dashed border-slate-800/50 rounded-[2.5rem] p-12 md:p-20 flex flex-col items-center justify-center text-center gap-4">
          <Target size={40} className="text-slate-800" />
          <p className="text-slate-600 font-black uppercase text-xs tracking-widest">
            Aún no tienes metas. Crea la primera arriba.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {active.map((g, i) => (
            <GoalCard key={g.id} goal={g} isFirst={i === 0} isLast={i === active.length - 1} />
          ))}
        </div>
      )}

      {/* COMPLETADAS */}
      {done.length > 0 && (
        <div className="space-y-5 pt-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic px-2">
            Completadas
          </h2>
          {done.map((g) => (
            <GoalCard key={g.id} goal={g} isFirst isLast />
          ))}
        </div>
      )}

      {/* ARCHIVADAS */}
      {archived.length > 0 && (
        <details className="group pt-4">
          <summary className="flex items-center gap-2 cursor-pointer text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic px-2 select-none hover:text-slate-300 transition-colors">
            <Archive size={13} />
            Archivadas ({archived.length})
          </summary>
          <div className="mt-4 space-y-2">
            {archived.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-3 bg-slate-900/20 border border-white/5 rounded-2xl px-4 py-3 group/item"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-400 truncate">{g.title}</p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{g.category}</p>
                </div>
                <form action={setGoalStatus} className="shrink-0">
                  <input type="hidden" name="id" value={g.id} />
                  <input type="hidden" name="status" value="active" />
                  <button type="submit" title="Reactivar" className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all">
                    <RotateCcw size={15} />
                  </button>
                </form>
                <form action={deleteGoal} className="shrink-0">
                  <input type="hidden" name="id" value={g.id} />
                  <button type="submit" title="Eliminar" className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                    <Trash2 size={15} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-[#0A0C10] border border-white/10 p-4 md:p-5 rounded-[1.5rem] text-center">
      <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
        {label}
      </p>
      <p className={`text-2xl md:text-3xl font-black font-mono tracking-tighter ${accent}`}>
        {value}
      </p>
    </div>
  );
}
