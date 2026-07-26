'use client';

import { useActionState, useEffect, useState } from 'react';
import {
  Trash2,
  Check,
  Plus,
  CheckCircle2,
  Circle,
  RotateCcw,
  Flag,
  CalendarClock,
  Pencil,
  X,
} from 'lucide-react';
import type { GoalWithProgress } from '@/services/metas';
import {
  setGoalStatus,
  deleteGoal,
  updateGoal,
  addMilestone,
  toggleMilestone,
  deleteMilestone,
} from './actions';
import { IDLE_STATE } from '@/lib/action';
import { GOAL_CATEGORIES } from '@/lib/constants';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { Button } from '@/components/ui/button';
import { InlineMessage } from '@/components/ui/inline-message';

function dueLabel(g: GoalWithProgress): { text: string; tone: string } | null {
  if (g.daysLeft === null || g.status === 'done') return null;
  if (g.daysLeft < 0) return { text: `Vencida hace ${Math.abs(g.daysLeft)} d`, tone: 'text-rose-400' };
  if (g.daysLeft === 0) return { text: 'Vence hoy', tone: 'text-amber-400' };
  if (g.daysLeft <= 7) return { text: `${g.daysLeft} d restantes`, tone: 'text-amber-400' };
  return { text: `${g.daysLeft} d restantes`, tone: 'text-slate-500' };
}

export default function GoalCard({ goal: g }: { goal: GoalWithProgress }) {
  const isDone = g.status === 'done';
  const due = dueLabel(g);

  const [editing, setEditing] = useState(false);
  const [editState, editAction] = useActionState(updateGoal, IDLE_STATE);

  useEffect(() => {
    if (editState.ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditing(false);
    }
  }, [editState]);

  if (editing) {
    return (
      <form
        action={editAction}
        className="bg-slate-900/40 border border-amber-500/20 rounded-[2rem] p-6 md:p-7 backdrop-blur-xl space-y-4"
      >
        <input type="hidden" name="id" value={g.id} />
        <InlineMessage state={editState} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Objetivo" error={editState.fieldErrors?.title} className="md:col-span-2">
            <Input name="title" required defaultValue={g.title} invalid={!!editState.fieldErrors?.title} />
          </Field>
          <Field label="Detalle" className="md:col-span-2">
            <Input name="description" defaultValue={g.description ?? ''} />
          </Field>
          <Field label="Categoría">
            <Select name="category" defaultValue={g.category}>
              {GOAL_CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[#0A0C10]">{c}</option>
              ))}
              {!GOAL_CATEGORIES.includes(g.category as (typeof GOAL_CATEGORIES)[number]) && (
                <option value={g.category} className="bg-[#0A0C10]">{g.category}</option>
              )}
            </Select>
          </Field>
          <Field label="Fecha límite" error={editState.fieldErrors?.target_date}>
            <Input name="target_date" type="date" defaultValue={g.target_date ?? ''} invalid={!!editState.fieldErrors?.target_date} />
          </Field>
        </div>
        <div className="flex items-center gap-2">
          <SubmitButton pendingText="Guardando…">
            <Check size={15} /> Guardar
          </SubmitButton>
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            <X size={15} /> Cancelar
          </Button>
        </div>
      </form>
    );
  }

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
          {!isDone && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              title="Editar meta"
              className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
            >
              <Pencil size={15} />
            </button>
          )}
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
            {g.totalMilestones > 0 ? `${g.doneMilestones}/${g.totalMilestones} hitos` : 'Sin hitos'}
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
                <button type="submit" className="flex items-center gap-2.5 w-full text-left py-1.5">
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
