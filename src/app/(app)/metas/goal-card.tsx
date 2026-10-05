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
  ChevronUp,
  ChevronDown,
  Archive,
  Gauge,
  Quote,
} from 'lucide-react';
import type { GoalWithProgress } from '@/services/metas';
import {
  setGoalStatus,
  deleteGoal,
  updateGoal,
  addMilestone,
  toggleMilestone,
  deleteMilestone,
  addGoalProgress,
  moveGoal,
} from './actions';
import { IDLE_STATE } from '@/lib/action';
import { GOAL_CATEGORIES } from '@/lib/constants';
import { formatCLP } from '@/lib/format';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { Button } from '@/components/ui/button';
import { InlineMessage } from '@/components/ui/inline-message';
import { NumberInput } from '@/components/ui/number-input';
import { fieldBase, fieldInvalid } from '@/components/ui/styles';
import { UNITS, unitFormat } from './units';

function fmt(v: number, unit: string | null): string {
  if (unit === '$') return formatCLP(v);
  return `${new Intl.NumberFormat('es-CL').format(v)}${unit ? ' ' + unit : ''}`;
}

function dueLabel(g: GoalWithProgress): { text: string; tone: string } | null {
  if (g.daysLeft === null || g.status === 'done') return null;
  if (g.daysLeft < 0) return { text: `Vencida hace ${Math.abs(g.daysLeft)} d`, tone: 'text-rose-400' };
  if (g.daysLeft === 0) return { text: 'Vence hoy', tone: 'text-amber-400' };
  if (g.daysLeft <= 7) return { text: `${g.daysLeft} d restantes`, tone: 'text-amber-400' };
  return { text: `${g.daysLeft} d restantes`, tone: 'text-ink-3' };
}

export default function GoalCard({
  goal: g,
  isFirst,
  isLast,
}: {
  goal: GoalWithProgress;
  isFirst: boolean;
  isLast: boolean;
}) {
  const isDone = g.status === 'done';
  const due = dueLabel(g);

  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<'hitos' | 'cantidad'>(g.measurable ? 'cantidad' : 'hitos');
  const [unit, setUnit] = useState(g.unit ?? '$');
  const [editState, editAction] = useActionState(updateGoal, IDLE_STATE);
  const [progressState, progressAction] = useActionState(addGoalProgress, IDLE_STATE);

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
        className="bg-surface border border-amber-500/20 rounded-3xl p-6 md:p-7 space-y-4"
      >
        <input type="hidden" name="id" value={g.id} />
        <InlineMessage state={editState} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Objetivo" error={editState.fieldErrors?.title} className="md:col-span-2">
            <Input name="title" required defaultValue={g.title} invalid={!!editState.fieldErrors?.title} />
          </Field>
          <Field label="Motivo" className="md:col-span-2">
            <Input name="motive" defaultValue={g.motive ?? ''} placeholder="Por qué importa…" />
          </Field>
          <Field label="Detalle" className="md:col-span-2">
            <Input name="description" defaultValue={g.description ?? ''} />
          </Field>
          <Field label="Categoría">
            <Select name="category" defaultValue={g.category}>
              {GOAL_CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-surface">{c}</option>
              ))}
              {!GOAL_CATEGORIES.includes(g.category as (typeof GOAL_CATEGORIES)[number]) && (
                <option value={g.category} className="bg-surface">{g.category}</option>
              )}
            </Select>
          </Field>
          <Field label="Fecha límite" error={editState.fieldErrors?.target_date}>
            <Input name="target_date" type="date" defaultValue={g.target_date ?? ''} invalid={!!editState.fieldErrors?.target_date} />
          </Field>
          <Field label="Medir por">
            <Select value={mode} onChange={(e) => setMode(e.target.value as 'hitos' | 'cantidad')}>
              <option value="hitos" className="bg-surface">Hitos</option>
              <option value="cantidad" className="bg-surface">Cantidad</option>
            </Select>
          </Field>
          {mode === 'cantidad' && (
            <>
              <Field label="Objetivo (cantidad)" error={editState.fieldErrors?.target_value}>
                <NumberInput
                  key={unit}
                  name="target_value"
                  {...unitFormat(unit)}
                  defaultValue={g.target_value ?? ''}
                  className={`${fieldBase} ${editState.fieldErrors?.target_value ? fieldInvalid : ''}`}
                />
              </Field>
              <Field label="Unidad">
                <Select name="unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
                  {UNITS.map((u) => (
                    <option key={u} value={u} className="bg-surface">{u}</option>
                  ))}
                </Select>
              </Field>
            </>
          )}
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
      className={`bg-surface border rounded-3xl p-6 md:p-7 backdrop-blur-xl transition-all ${
        isDone ? 'border-emerald-500/20 opacity-80' : 'border-line'
      }`}
    >
      {/* Encabezado: en el celular las acciones van debajo del título (no lo aplastan) */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-xs font-semibold text-amber-400 border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 rounded-md tracking-wide">
              {g.category}
            </span>
            {due && (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold tracking-wide ${due.tone}`}>
                <CalendarClock size={11} />
                {due.text}
              </span>
            )}
            {g.pace && (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold tracking-wide ${g.pace.onTrack ? 'text-emerald-400' : 'text-amber-400'}`}>
                <Gauge size={11} />
                {g.pace.onTrack ? 'Al día' : `Vas atrás · meta ${g.pace.expectedPct}%`}
              </span>
            )}
            {g.saving_name && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-400 tracking-wide">
                🔗 {g.saving_name}
              </span>
            )}
          </div>
          <h3 className={`text-xl md:text-2xl font-semibold tracking-tight ${isDone ? 'text-emerald-300 line-through' : 'text-ink'}`}>
            {g.title}
          </h3>
          {g.description && (
            <p className="text-sm text-ink-3 font-medium mt-1 leading-relaxed">{g.description}</p>
          )}
          {g.motive && (
            <p className="flex items-start gap-1.5 text-xs text-amber-300/70 font-medium mt-2">
              <Quote size={12} className="shrink-0 mt-0.5" />
              {g.motive}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center flex-wrap gap-1 shrink-0 -ml-2 sm:ml-0">
          {!isDone && (
            <div className="flex">
              {!isFirst && (
                <form action={moveGoal}>
                  <input type="hidden" name="id" value={g.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button type="submit" title="Subir" className="h-11 w-9 flex items-center justify-center rounded-xl text-ink-3 hover:text-amber-400 transition-colors">
                    <ChevronUp size={16} />
                  </button>
                </form>
              )}
              {!isLast && (
                <form action={moveGoal}>
                  <input type="hidden" name="id" value={g.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button type="submit" title="Bajar" className="h-11 w-9 flex items-center justify-center rounded-xl text-ink-3 hover:text-amber-400 transition-colors">
                    <ChevronDown size={16} />
                  </button>
                </form>
              )}
            </div>
          )}
          {!isDone && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              title="Editar meta"
              className="h-11 w-11 flex items-center justify-center rounded-xl text-ink-3 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
            >
              <Pencil size={15} />
            </button>
          )}
          {isDone ? (
            <form action={setGoalStatus}>
              <input type="hidden" name="id" value={g.id} />
              <input type="hidden" name="status" value="active" />
              <button type="submit" title="Reactivar" className="h-11 w-11 flex items-center justify-center rounded-xl text-ink-3 hover:text-amber-400 hover:bg-amber-500/10 transition-all">
                <RotateCcw size={16} />
              </button>
            </form>
          ) : (
            <form action={setGoalStatus}>
              <input type="hidden" name="id" value={g.id} />
              <input type="hidden" name="status" value="done" />
              <button type="submit" title="Completar" className="inline-flex items-center gap-1.5 min-h-11 bg-success/15 border border-success/30 text-success hover:bg-success/25 text-sm font-semibold px-3.5 rounded-xl transition-all active:scale-95">
                <Check size={13} /> Completar
              </button>
            </form>
          )}
          <form action={setGoalStatus}>
            <input type="hidden" name="id" value={g.id} />
            <input type="hidden" name="status" value="archived" />
            <button type="submit" title="Archivar" className="h-11 w-11 flex items-center justify-center rounded-xl text-ink-3 hover:text-ink-2 hover:bg-white/5 transition-all">
              <Archive size={15} />
            </button>
          </form>
          <ConfirmAction
            action={deleteGoal}
            fields={{ id: g.id }}
            title={`¿Eliminar "${g.title}"?`}
            message="Se borra con sus hitos y su avance. Si solo quieres sacarla de la vista, mejor archívala."
            confirmLabel="Eliminar"
            triggerTitle="Eliminar meta"
            triggerClassName="h-11 w-11 flex items-center justify-center rounded-xl text-ink-3 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
          >
            <Trash2 size={16} />
            <span className="sr-only">Eliminar meta</span>
          </ConfirmAction>
        </div>
      </div>

      {/* Progreso */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-ink-3 tracking-wide">
            {g.measurable
              ? `${fmt(g.current_value, g.unit)} / ${fmt(g.target_value ?? 0, g.unit)}`
              : g.totalMilestones > 0
                ? `${g.doneMilestones}/${g.totalMilestones} hitos`
                : 'Sin hitos'}
          </span>
          <span className={`text-xs font-semibold tabular-nums ${isDone ? 'text-emerald-400' : 'text-amber-400'}`}>
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

      {/* Registrar avance (metas medibles, no vinculadas a un ahorro) */}
      {g.measurable && !isDone && !g.saving_name && (
        <form action={progressAction} className="mt-4 flex items-center gap-2">
          <input type="hidden" name="id" value={g.id} />
          <div className="flex-1 flex items-center gap-2 bg-black/30 border border-line-strong rounded-xl px-3 focus-within:border-amber-500/50 transition-colors">
            <Plus size={14} className="text-ink-3 shrink-0" />
            <div className="flex-1">
              <NumberInput
                name="amount"
                required
                allowNegative
                {...unitFormat(g.unit)}
                placeholder={g.unit === '$' ? 'Registrar avance (ej: 50.000)' : 'Registrar avance'}
                className="bg-transparent py-2.5 text-sm text-ink placeholder:text-ink-3 outline-none w-full"
              />
            </div>
          </div>
          <SubmitButton pendingText="…" className="bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30">
            Sumar
          </SubmitButton>
        </form>
      )}
      {progressState.message && !progressState.ok && (
        <p className="text-xs font-bold text-rose-400 mt-1.5">{progressState.message}</p>
      )}

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
                    <Circle size={17} className="text-ink-3 shrink-0 group-hover:text-amber-400 transition-colors" />
                  )}
                  <span className={`text-sm font-medium truncate ${m.done ? 'text-ink-3 line-through' : 'text-ink'}`}>
                    {m.title}
                  </span>
                </button>
              </form>
              <form action={deleteMilestone}>
                <input type="hidden" name="id" value={m.id} />
                <button type="submit" title="Eliminar hito" aria-label={`Eliminar hito ${m.title}`} className="h-11 w-11 flex items-center justify-center rounded-xl text-ink-3 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                  <Trash2 size={15} />
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
          <div className="flex-1 flex items-center gap-2 bg-black/30 border border-line-strong rounded-xl px-3 focus-within:border-amber-500/50 transition-colors">
            <Flag size={14} className="text-ink-3 shrink-0" />
            <input
              name="title"
              required
              placeholder="Agregar un hito…"
              className="bg-transparent py-2.5 text-sm text-ink placeholder:text-ink-3 outline-none w-full"
            />
          </div>
          <button type="submit" className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-line-strong text-ink-2 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30 transition-all active:scale-95">
            <Plus size={16} />
          </button>
        </form>
      )}
    </div>
  );
}
