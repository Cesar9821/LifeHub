'use client';

import { useActionState, useEffect, useState } from 'react';
import { Flame, Power, Trash2, Pencil, Check, X } from 'lucide-react';
import { deleteHabit, toggleHabitActive, updateHabit } from '../actions';
import { IDLE_STATE } from '@/lib/action';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { Button } from '@/components/ui/button';
import { InlineMessage } from '@/components/ui/inline-message';

export interface HabitItemData {
  id: string;
  name: string;
  description: string | null;
  kind: 'build' | 'break';
  frequency: string;
  target_per_week: number;
  streak: number;
  bestStreak: number;
  is_active: boolean;
}

export default function HabitItem({ habit: h }: { habit: HabitItemData }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState(updateHabit, IDLE_STATE);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>(
    h.frequency === 'weekly' ? 'weekly' : 'daily'
  );

  useEffect(() => {
    if (state.ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditing(false);
    }
  }, [state]);

  if (editing) {
    return (
      <form action={formAction} className="bg-slate-900/50 border border-violet-500/20 rounded-xl p-4 space-y-3">
        <input type="hidden" name="id" value={h.id} />
        <InlineMessage state={state} />
        <Field label="Hábito" error={state.fieldErrors?.name}>
          <Input name="name" required defaultValue={h.name} invalid={!!state.fieldErrors?.name} />
        </Field>
        <Field label="Detalle">
          <Input name="description" defaultValue={h.description ?? ''} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Tipo">
            <Select name="kind" defaultValue={h.kind}>
              <option value="build" className="bg-[#0A0C10]">Construir</option>
              <option value="break" className="bg-[#0A0C10]">Evitar</option>
            </Select>
          </Field>
          <Field label="Frecuencia">
            <Select
              name="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly')}
            >
              <option value="daily" className="bg-[#0A0C10]">Todos los días</option>
              <option value="weekly" className="bg-[#0A0C10]">Veces por semana</option>
            </Select>
          </Field>
          {frequency === 'weekly' ? (
            <Field label="Veces por semana">
              <Input name="target_per_week" type="number" min="1" max="7" defaultValue={h.target_per_week} />
            </Field>
          ) : (
            <input type="hidden" name="target_per_week" value={7} />
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
    <div className="flex items-center justify-between gap-3 bg-black/20 border border-white/5 rounded-xl px-4 py-3 group">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-200 truncate">{h.name}</p>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {h.frequency === 'daily' ? 'Diario' : `${h.target_per_week}× por semana`}
          {h.bestStreak > 0 && ` · récord ${h.bestStreak}`}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className={`flex items-center gap-1 ${h.streak > 0 ? 'text-orange-400' : 'text-slate-600'}`}>
          <Flame size={13} />
          <span className="font-black font-mono text-sm">{h.streak}</span>
        </div>

        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Editar"
          className="text-slate-600 hover:text-violet-400 transition-colors opacity-60 md:opacity-0 md:group-hover:opacity-100"
        >
          <Pencil size={14} />
        </button>

        <form action={toggleHabitActive}>
          <input type="hidden" name="id" value={h.id} />
          <input type="hidden" name="is_active" value={String(h.is_active)} />
          <button type="submit" title="Pausar" className="text-emerald-500 hover:text-emerald-400 transition-colors">
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
  );
}
