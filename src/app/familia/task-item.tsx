'use client';

import { useActionState, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Trash2,
  UserCircle2,
  CalendarClock,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import type { HouseholdTask } from '@/services/familia';
import { toggleTask, deleteTask, updateTask } from './actions';
import { IDLE_STATE } from '@/lib/action';
import { Input, Select } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { Button } from '@/components/ui/button';
import { InlineMessage } from '@/components/ui/inline-message';

function dueInfo(t: HouseholdTask): { text: string; tone: string } | null {
  if (!t.due_date || t.done) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = t.due_date.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  const label = new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short' }).format(due);
  if (days < 0) return { text: `${label} · atrasada`, tone: 'text-rose-400' };
  if (days === 0) return { text: 'Hoy', tone: 'text-orange-400' };
  if (days <= 3) return { text: label, tone: 'text-orange-400' };
  return { text: label, tone: 'text-slate-500' };
}

export default function TaskItem({
  task: t,
  members,
  assigneeName,
}: {
  task: HouseholdTask;
  members: { user_id: string; full_name: string }[];
  assigneeName: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState(updateTask, IDLE_STATE);

  useEffect(() => {
    if (state.ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditing(false);
    }
  }, [state]);

  if (editing) {
    return (
      <form
        action={formAction}
        className="bg-slate-900/40 border border-orange-500/20 rounded-2xl p-4 space-y-3"
      >
        <input type="hidden" name="id" value={t.id} />
        <InlineMessage state={state} />
        <Input name="title" required defaultValue={t.title} invalid={!!state.fieldErrors?.title} />
        <div className="flex flex-col sm:flex-row gap-3">
          <Select name="assigned_to" defaultValue={t.assigned_to ?? ''} className="flex-1">
            <option value="" className="bg-[#0A0C10]">Sin asignar</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id} className="bg-[#0A0C10]">
                {m.full_name}
              </option>
            ))}
          </Select>
          <Input name="due_date" type="date" defaultValue={t.due_date ?? ''} className="sm:w-44" />
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

  const due = dueInfo(t);

  return (
    <div className="group flex items-center gap-3 bg-slate-900/30 border border-white/5 rounded-2xl px-4 py-3 hover:bg-slate-800/40 transition-all">
      <form action={toggleTask} className="shrink-0">
        <input type="hidden" name="id" value={t.id} />
        <input type="hidden" name="done" value={String(t.done)} />
        <button type="submit" className="flex items-center" title={t.done ? 'Marcar pendiente' : 'Marcar hecha'}>
          {t.done ? (
            <CheckCircle2 size={20} className="text-emerald-400" />
          ) : (
            <Circle size={20} className="text-slate-600 hover:text-orange-400 transition-colors" />
          )}
        </button>
      </form>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${t.done ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
          {t.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          {assigneeName && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-400/80 uppercase tracking-wide">
              <UserCircle2 size={12} /> {assigneeName}
            </span>
          )}
          {due && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${due.tone}`}>
              <CalendarClock size={12} /> {due.text}
            </span>
          )}
        </div>
      </div>

      {!t.done && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Editar"
          className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-orange-400 hover:bg-orange-500/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
        >
          <Pencil size={14} />
        </button>
      )}

      <form action={deleteTask} className="shrink-0">
        <input type="hidden" name="id" value={t.id} />
        <button
          type="submit"
          title="Eliminar"
          className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={15} />
        </button>
      </form>
    </div>
  );
}
