import {
  Users,
  Trash2,
  CheckCircle2,
  Circle,
  ShoppingCart,
  ListTodo,
  UserCircle2,
  CalendarClock,
  Eraser,
} from 'lucide-react';
import {
  getTasks,
  getShoppingItems,
  summarizeFamilia,
  type HouseholdTask,
} from '@/services/familia';
import { getHouseholdMembers } from '@/services/household';
import TaskForm from './task-form';
import ShoppingForm from './shopping-form';
import {
  toggleTask,
  deleteTask,
  toggleShoppingItem,
  deleteShoppingItem,
  clearCheckedShopping,
} from './actions';

export const dynamic = 'force-dynamic';

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

export default async function FamiliaPage() {
  const [tasks, shopping, members] = await Promise.all([
    getTasks(),
    getShoppingItems(),
    getHouseholdMembers(),
  ]);

  const summary = summarizeFamilia(tasks, shopping);
  const nameById = new Map(members.map((m) => [m.user_id, m.full_name]));
  const checkedCount = shopping.filter((s) => s.checked).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-10 pb-20">
      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/5 w-fit">
          <Users size={12} className="text-orange-400" />
          <span className="text-[9px] md:text-[10px] font-bold text-orange-400/80 uppercase tracking-[0.2em]">
            Organización en casa
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic">
          Familia<span className="text-orange-500">.</span>
        </h1>
      </div>

      {/* RESUMEN */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StatTile label="Tareas pendientes" value={String(summary.pendingTasks)} accent="text-white" />
        <StatTile label="Completadas" value={String(summary.doneTasks)} accent="text-emerald-400" />
        <StatTile label="Por comprar" value={String(summary.shoppingPending)} accent="text-orange-400" />
      </div>

      {/* TAREAS */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 px-1">
          <ListTodo size={18} className="text-orange-400" />
          <h2 className="text-lg font-black text-white uppercase tracking-wider">Tareas del hogar</h2>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-7 backdrop-blur-xl">
          <TaskForm members={members} />
        </div>

        {tasks.length === 0 ? (
          <EmptyState icon={<ListTodo size={34} className="text-slate-800" />} text="Sin tareas por ahora" />
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => {
              const due = dueInfo(t);
              const who = t.assigned_to ? nameById.get(t.assigned_to) : null;
              return (
                <div
                  key={t.id}
                  className="group flex items-center gap-3 bg-slate-900/30 border border-white/5 rounded-2xl px-4 py-3 hover:bg-slate-800/40 transition-all"
                >
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
                      {who && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-400/80 uppercase tracking-wide">
                          <UserCircle2 size={12} /> {who}
                        </span>
                      )}
                      {due && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${due.tone}`}>
                          <CalendarClock size={12} /> {due.text}
                        </span>
                      )}
                    </div>
                  </div>

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
            })}
          </div>
        )}
      </section>

      {/* COMPRAS */}
      <section className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-orange-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-wider">Lista de compras</h2>
          </div>
          {checkedCount > 0 && (
            <form action={clearCheckedShopping}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-rose-400 uppercase tracking-widest transition-colors"
              >
                <Eraser size={13} /> Limpiar comprados ({checkedCount})
              </button>
            </form>
          )}
        </div>

        <ShoppingForm />

        {shopping.length === 0 ? (
          <EmptyState icon={<ShoppingCart size={34} className="text-slate-800" />} text="La lista está vacía" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {shopping.map((s) => (
              <div
                key={s.id}
                className="group flex items-center gap-3 bg-slate-900/30 border border-white/5 rounded-2xl px-4 py-3 hover:bg-slate-800/40 transition-all"
              >
                <form action={toggleShoppingItem} className="shrink-0">
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="checked" value={String(s.checked)} />
                  <button type="submit" className="flex items-center">
                    {s.checked ? (
                      <CheckCircle2 size={19} className="text-emerald-400" />
                    ) : (
                      <Circle size={19} className="text-slate-600 hover:text-orange-400 transition-colors" />
                    )}
                  </button>
                </form>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-bold ${s.checked ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                    {s.name}
                  </span>
                  {s.quantity && (
                    <span className="text-[11px] font-mono text-slate-500 ml-2">{s.quantity}</span>
                  )}
                </div>
                <form action={deleteShoppingItem} className="shrink-0">
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    title="Eliminar"
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-[#0A0C10] border border-white/10 p-4 md:p-5 rounded-[1.5rem] text-center">
      <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
        {label}
      </p>
      <p className={`text-2xl md:text-3xl font-black font-mono tracking-tighter ${accent}`}>{value}</p>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="border-2 border-dashed border-slate-800/50 rounded-[2rem] p-10 md:p-14 flex flex-col items-center justify-center text-center gap-3">
      {icon}
      <p className="text-slate-600 font-black uppercase text-xs tracking-widest">{text}</p>
    </div>
  );
}
