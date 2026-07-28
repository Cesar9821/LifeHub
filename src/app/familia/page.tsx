import {
  Users,
  Trash2,
  CheckCircle2,
  Circle,
  ShoppingCart,
  ListTodo,
  RotateCcw,
  Repeat,
  CalendarDays,
  Clock,
  UtensilsCrossed,
  Trophy,
} from 'lucide-react';
import {
  getTasks,
  getShoppingData,
  getUpcomingEvents,
  getMealPlan,
  summarizeFamilia,
  type ShoppingListWithItems,
  type ShoppingItem,
  type ResetPeriod,
  type HouseholdEvent,
} from '@/services/familia';
import { getHouseholdMembers } from '@/services/household';
import { daysUntil } from '@/lib/format';
import TaskForm from './task-form';
import TaskItem from './task-item';
import ShoppingForm from './shopping-form';
import ListForm from './list-form';
import EventForm from './event-form';
import MealPlanner from './meal-planner';
import {
  toggleShoppingItem,
  deleteShoppingItem,
  resetListNow,
  deleteShoppingList,
  deleteEvent,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function FamiliaPage() {
  const [tasks, shoppingData, members, events, mealPlan] = await Promise.all([
    getTasks(),
    getShoppingData(),
    getHouseholdMembers(),
    getUpcomingEvents(),
    getMealPlan(),
  ]);

  const { lists, orphans, allItems } = shoppingData;
  const summary = summarizeFamilia(tasks, allItems);
  const nameById = new Map(members.map((m) => [m.user_id, m.full_name]));

  // Ranking del hogar: 1 punto por tarea completada asignada.
  const points = new Map<string, number>();
  for (const t of tasks) if (t.done && t.assigned_to) points.set(t.assigned_to, (points.get(t.assigned_to) || 0) + 1);
  const ranking = members
    .map((m) => ({ name: m.full_name, pts: points.get(m.user_id) || 0 }))
    .sort((a, b) => b.pts - a.pts);
  const hasPoints = ranking.some((r) => r.pts > 0);

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatTile label="Tareas pendientes" value={String(summary.pendingTasks)} accent="text-white" />
        <StatTile label="Eventos próximos" value={String(events.length)} accent="text-sky-400" />
        <StatTile label="Por comprar" value={String(summary.shoppingPending)} accent="text-orange-400" />
        <StatTile label="Completadas" value={String(summary.doneTasks)} accent="text-emerald-400" />
      </div>

      {/* RANKING DEL HOGAR */}
      {hasPoints && members.length > 1 && (
        <div className="bg-slate-900/40 border border-white/5 rounded-[1.75rem] p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-amber-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Ranking del hogar</h2>
          </div>
          <div className="space-y-2">
            {ranking.map((r, i) => (
              <div key={r.name} className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-200">
                  {['🥇', '🥈', '🥉'][i] ?? '·'} {r.name}
                </span>
                <span className="text-sm font-black font-mono text-amber-400">{r.pts} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
            {tasks.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                members={members}
                assigneeName={t.assigned_to ? nameById.get(t.assigned_to) ?? null : null}
              />
            ))}
          </div>
        )}
      </section>

      {/* CALENDARIO */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 px-1">
          <CalendarDays size={18} className="text-orange-400" />
          <h2 className="text-lg font-black text-white uppercase tracking-wider">Calendario</h2>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-7 backdrop-blur-xl">
          <EventForm />
        </div>

        {events.length === 0 ? (
          <EmptyState icon={<CalendarDays size={34} className="text-slate-800" />} text="Sin eventos próximos" />
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>

      {/* MENÚ SEMANAL */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 px-1">
          <UtensilsCrossed size={18} className="text-orange-400" />
          <h2 className="text-lg font-black text-white uppercase tracking-wider">Menú de la semana</h2>
        </div>
        <MealPlanner plan={mealPlan} />
      </section>

      {/* COMPRAS */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 px-1">
          <ShoppingCart size={18} className="text-orange-400" />
          <h2 className="text-lg font-black text-white uppercase tracking-wider">Listas de compras</h2>
        </div>

        <ListForm />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {lists.map((list) => (
            <ShoppingListCard key={list.id} list={list} />
          ))}
        </div>

        {orphans.length > 0 && (
          <div className="bg-slate-900/30 border border-white/5 rounded-[2rem] p-5 md:p-6 space-y-3">
            <h3 className="text-base font-black text-white uppercase tracking-wide">Otros</h3>
            <div className="space-y-1.5">
              {orphans.map((item) => (
                <ShoppingRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function resetBadge(period: ResetPeriod) {
  if (period === 'none') return null;
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black text-orange-400 border border-orange-500/20 bg-orange-500/5 px-2 py-0.5 rounded-md uppercase tracking-widest">
      <Repeat size={10} /> {period === 'weekly' ? 'Semanal' : 'Mensual'}
    </span>
  );
}

function ShoppingListCard({ list }: { list: ShoppingListWithItems }) {
  return (
    <div className="bg-slate-900/30 border border-white/5 rounded-[2rem] p-5 md:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <h3 className="text-base font-black text-white uppercase tracking-wide truncate">{list.name}</h3>
          {resetBadge(list.reset_period)}
          <span className="text-[10px] font-mono text-slate-500">{list.pending} por comprar</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {list.items.length > 0 && (
            <form action={resetListNow}>
              <input type="hidden" name="id" value={list.id} />
              <button
                type="submit"
                title="Reiniciar (desmarcar todo)"
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-orange-400 hover:bg-orange-500/10 transition-all"
              >
                <RotateCcw size={14} />
              </button>
            </form>
          )}
          <form action={deleteShoppingList}>
            <input type="hidden" name="id" value={list.id} />
            <button
              type="submit"
              title="Eliminar lista"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </form>
        </div>
      </div>

      {list.items.length > 0 && (
        <div className="space-y-1.5">
          {list.items.map((item) => (
            <ShoppingRow key={item.id} item={item} />
          ))}
        </div>
      )}

      <ShoppingForm listId={list.id} />
    </div>
  );
}

function ShoppingRow({ item }: { item: ShoppingItem }) {
  return (
    <div className="group flex items-center gap-3">
      <form action={toggleShoppingItem} className="shrink-0">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="checked" value={String(item.checked)} />
        <button type="submit" className="flex items-center">
          {item.checked ? (
            <CheckCircle2 size={19} className="text-emerald-400" />
          ) : (
            <Circle size={19} className="text-slate-600 hover:text-orange-400 transition-colors" />
          )}
        </button>
      </form>
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-bold ${item.checked ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
          {item.name}
        </span>
        {item.quantity && <span className="text-[11px] font-mono text-slate-500 ml-2">{item.quantity}</span>}
      </div>
      <form action={deleteShoppingItem} className="shrink-0">
        <input type="hidden" name="id" value={item.id} />
        <button
          type="submit"
          title="Eliminar"
          className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={13} />
        </button>
      </form>
    </div>
  );
}

function eventWhen(e: HouseholdEvent): { day: string; mon: string; label: string; tone: string } {
  const d = daysUntil(e.event_date);
  const [y, m, dd] = e.event_date.split('-').map(Number);
  const dt = new Date(y, m - 1, dd);
  const day = String(dd).padStart(2, '0');
  const mon = new Intl.DateTimeFormat('es-CL', { month: 'short' }).format(dt);
  if (d <= 0) return { day, mon, label: 'Hoy', tone: 'text-rose-400' };
  if (d === 1) return { day, mon, label: 'Mañana', tone: 'text-amber-400' };
  if (d <= 7) return { day, mon, label: `En ${d} días`, tone: 'text-amber-400' };
  return {
    day,
    mon,
    label: new Intl.DateTimeFormat('es-CL', { weekday: 'long' }).format(dt),
    tone: 'text-slate-500',
  };
}

function EventRow({ event: e }: { event: HouseholdEvent }) {
  const w = eventWhen(e);
  return (
    <div className="group flex items-center gap-3 bg-slate-900/30 border border-white/5 rounded-2xl px-4 py-3 hover:bg-slate-800/40 transition-all">
      <div className="shrink-0 h-12 w-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex flex-col items-center justify-center leading-none">
        <span className="text-base font-black text-sky-300 font-mono">{w.day}</span>
        <span className="text-[8px] font-black text-sky-400/70 uppercase">{w.mon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-100 truncate">{e.title}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className={`text-[10px] font-black uppercase tracking-wide ${w.tone}`}>{w.label}</span>
          {e.event_time && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
              <Clock size={11} /> {e.event_time.slice(0, 5)}
            </span>
          )}
        </div>
      </div>
      <form action={deleteEvent} className="shrink-0">
        <input type="hidden" name="id" value={e.id} />
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
