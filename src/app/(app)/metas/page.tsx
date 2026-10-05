import Link from 'next/link';
import { Target, Archive, RotateCcw, Trash2, Image as ImageIcon } from 'lucide-react';
import { getGoals, getArchivedGoals, getLinkableSavings, summarizeGoals } from '@/services/metas';
import { setGoalStatus, deleteGoal } from './actions';
import GoalForm from './goal-form';
import { PageHeader } from '@/components/ui/card';
import GoalCard from './goal-card';

export const dynamic = 'force-dynamic';

export default async function MetasPage() {
  const [goals, archived, savings] = await Promise.all([getGoals(), getArchivedGoals(), getLinkableSavings()]);
  const summary = summarizeGoals(goals);

  const active = goals.filter((g) => g.status === 'active');
  const done = goals.filter((g) => g.status === 'done');

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title="Objetivos"
        subtitle="Tus metas de siempre, ahora como objetivos. Los proyectos activos viven en Proyectos."
      >
        <Link
          href="/vision"
          className="inline-flex items-center gap-1.5 min-h-11 px-3 rounded-xl border border-line-strong text-sm font-medium text-ink-2 hover:text-ink"
        >
          <ImageIcon size={16} /> Tablero de visión
        </Link>
      </PageHeader>

      {/* RESUMEN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatTile label="Activas" value={String(summary.active)} accent="text-ink" />
        <StatTile label="Progreso medio" value={`${summary.avgProgress}%`} accent="text-amber-400" />
        <StatTile label="Completadas" value={String(summary.done)} accent="text-emerald-400" />
        <StatTile
          label="Vencidas"
          value={String(summary.overdue)}
          accent={summary.overdue > 0 ? 'text-rose-400' : 'text-ink-3'}
        />
      </div>

      {/* LOGROS */}
      {summary.done > 0 && (
        <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-3xl p-5 flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <p className="text-sm font-semibold text-ink">
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
          <p className="text-ink-3 font-semibold text-xs tracking-wide">
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
          <h2 className="text-xs font-semibold text-ink-3 tracking-wide px-2">
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
          <summary className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink-3 tracking-wide px-2 select-none hover:text-ink-2 transition-colors">
            <Archive size={13} />
            Archivadas ({archived.length})
          </summary>
          <div className="mt-4 space-y-2">
            {archived.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-3 bg-surface border border-line rounded-2xl px-4 py-3 group/item"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink-2 truncate">{g.title}</p>
                  <p className="text-xs font-semibold text-ink-3 tracking-wide">{g.category}</p>
                </div>
                <form action={setGoalStatus} className="shrink-0">
                  <input type="hidden" name="id" value={g.id} />
                  <input type="hidden" name="status" value="active" />
                  <button type="submit" title="Reactivar" className="h-8 w-8 flex items-center justify-center rounded-lg text-ink-3 hover:text-amber-400 hover:bg-amber-500/10 transition-all">
                    <RotateCcw size={15} />
                  </button>
                </form>
                <form action={deleteGoal} className="shrink-0">
                  <input type="hidden" name="id" value={g.id} />
                  <button type="submit" title="Eliminar" className="h-8 w-8 flex items-center justify-center rounded-lg text-ink-3 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
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
    <div className="bg-surface border border-line-strong p-4 md:p-5 rounded-2xl text-center">
      <p className="text-xs md:text-xs font-semibold text-ink-3 tracking-wide mb-1.5">
        {label}
      </p>
      <p className={`text-2xl md:text-3xl font-semibold tabular-nums tracking-tight ${accent}`}>
        {value}
      </p>
    </div>
  );
}
