import { Target } from 'lucide-react';
import { getGoals, summarizeGoals } from '@/services/metas';
import GoalForm from './goal-form';
import GoalCard from './goal-card';

export const dynamic = 'force-dynamic';

export default async function MetasPage() {
  const goals = await getGoals();
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

      {/* FORMULARIO */}
      <GoalForm />

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
          {active.map((g) => (
            <GoalCard key={g.id} goal={g} />
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
            <GoalCard key={g.id} goal={g} />
          ))}
        </div>
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
