import {
  Target,
  Trash2,
  Check,
  Plus,
  CheckCircle2,
  Circle,
  RotateCcw,
  Flag,
  CalendarClock,
} from 'lucide-react';
import { getGoals, summarizeGoals, type GoalWithProgress } from '@/services/metas';
import GoalForm from './goal-form';
import {
  setGoalStatus,
  deleteGoal,
  addMilestone,
  toggleMilestone,
  deleteMilestone,
} from './actions';

export const dynamic = 'force-dynamic';

function dueLabel(g: GoalWithProgress): { text: string; tone: string } | null {
  if (g.daysLeft === null) return null;
  if (g.status === 'done') return null;
  if (g.daysLeft < 0)
    return { text: `Vencida hace ${Math.abs(g.daysLeft)} d`, tone: 'text-rose-400' };
  if (g.daysLeft === 0) return { text: 'Vence hoy', tone: 'text-amber-400' };
  if (g.daysLeft <= 7) return { text: `${g.daysLeft} d restantes`, tone: 'text-amber-400' };
  return { text: `${g.daysLeft} d restantes`, tone: 'text-slate-500' };
}

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

function GoalCard({ goal: g }: { goal: GoalWithProgress }) {
  const isDone = g.status === 'done';
  const due = dueLabel(g);

  return (
    <div
      className={`bg-slate-900/40 border rounded-[2rem] p-6 md:p-7 backdrop-blur-xl transition-all ${
        isDone ? 'border-emerald-500/20 opacity-80' : 'border-white/5'
      }`}
    >
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-[9px] font-black text-amber-400 border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 rounded-md uppercase tracking-widest">
              {g.category}
            </span>
            {due && (
              <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${due.tone}`}>
                <CalendarClock size={11} />
                {due.text}
              </span>
            )}
          </div>
          <h3 className={`text-xl md:text-2xl font-black tracking-tight ${isDone ? 'text-emerald-300 line-through' : 'text-white'}`}>
            {g.title}
          </h3>
          {g.description && (
            <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">{g.description}</p>
          )}
        </div>

        {/* Acciones de la meta */}
        <div className="flex items-center gap-2 shrink-0">
          {isDone ? (
            <form action={setGoalStatus}>
              <input type="hidden" name="id" value={g.id} />
              <input type="hidden" name="status" value="active" />
              <button
                type="submit"
                title="Reactivar"
                className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
              >
                <RotateCcw size={16} />
              </button>
            </form>
          ) : (
            <form action={setGoalStatus}>
              <input type="hidden" name="id" value={g.id} />
              <input type="hidden" name="status" value="done" />
              <button
                type="submit"
                title="Marcar como completada"
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl transition-all active:scale-95"
              >
                <Check size={13} /> Completar
              </button>
            </form>
          )}
          <form action={deleteGoal}>
            <input type="hidden" name="id" value={g.id} />
            <button
              type="submit"
              title="Eliminar meta"
              className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
            >
              <Trash2 size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            {g.totalMilestones > 0
              ? `${g.doneMilestones}/${g.totalMilestones} hitos`
              : 'Sin hitos'}
          </span>
          <span className={`text-xs font-black font-mono ${isDone ? 'text-emerald-400' : 'text-amber-400'}`}>
            {g.progress}%
          </span>
        </div>
        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isDone ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${g.progress}%` }}
          />
        </div>
      </div>

      {/* Hitos */}
      {g.milestones.length > 0 && (
        <div className="mt-5 space-y-1.5">
          {g.milestones.map((m) => (
            <div key={m.id} className="flex items-center gap-3 group">
              <form action={toggleMilestone} className="flex-1 min-w-0">
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="done" value={String(m.done)} />
                <button
                  type="submit"
                  className="flex items-center gap-2.5 w-full text-left py-1.5"
                >
                  {m.done ? (
                    <CheckCircle2 size={17} className="text-emerald-400 shrink-0" />
                  ) : (
                    <Circle size={17} className="text-slate-600 shrink-0 group-hover:text-amber-400 transition-colors" />
                  )}
                  <span className={`text-sm font-medium truncate ${m.done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {m.title}
                  </span>
                </button>
              </form>
              <form action={deleteMilestone}>
                <input type="hidden" name="id" value={m.id} />
                <button
                  type="submit"
                  title="Eliminar hito"
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {/* Agregar hito */}
      {!isDone && (
        <form action={addMilestone} className="mt-4 flex items-center gap-2">
          <input type="hidden" name="goal_id" value={g.id} />
          <div className="flex-1 flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 focus-within:border-amber-500/50 transition-colors">
            <Flag size={14} className="text-slate-600 shrink-0" />
            <input
              name="title"
              required
              placeholder="Agregar un hito…"
              className="bg-transparent py-2.5 text-sm text-white placeholder:text-slate-600 outline-none w-full"
            />
          </div>
          <button
            type="submit"
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30 transition-all active:scale-95"
          >
            <Plus size={16} />
          </button>
        </form>
      )}
    </div>
  );
}
