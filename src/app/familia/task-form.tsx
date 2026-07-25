'use client';

import { Plus } from 'lucide-react';
import { addTask } from './actions';

export default function TaskForm({
  members,
}: {
  members: { user_id: string; full_name: string }[];
}) {
  const inputStyles =
    'bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all w-full';

  return (
    <form action={addTask} className="flex flex-col md:flex-row gap-3 md:items-end">
      <div className="flex flex-col gap-1.5 flex-1">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
          Nueva tarea
        </label>
        <input
          name="title"
          required
          placeholder="Ej: Sacar la basura, Pagar el gas…"
          className={inputStyles}
        />
      </div>
      <div className="flex flex-col gap-1.5 md:w-44">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
          Responsable
        </label>
        <select name="assigned_to" defaultValue="" className={`${inputStyles} appearance-none pr-8`}>
          <option value="" className="bg-[#0A0C10]">Sin asignar</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id} className="bg-[#0A0C10]">
              {m.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5 md:w-44">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
          Fecha (opcional)
        </label>
        <input name="due_date" type="date" className={inputStyles} />
      </div>
      <button
        type="submit"
        className="bg-white text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95"
      >
        <Plus size={15} /> Agregar
      </button>
    </form>
  );
}
