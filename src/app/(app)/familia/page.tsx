import {
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
  Cake,
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
import Link from 'next/link';
import { PageHeader } from '@/components/ui/card';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { getHouseholdMembers } from '@/services/household';
import { daysUntil } from '@/lib/format';
import TaskForm from './task-form';
import TaskItem from './task-item';
import ShoppingForm from './shopping-form';
import ListForm from './list-form';
import EventForm from './event-form';
import MealPlanner from './meal-planner';
import { FamilyDates } from '@/components/wellbeing/family-dates';
import { loadFamilyDates, WELLBEING_SQL_MISSING } from '@/services/wellbeing';
import {
  toggleShoppingItem,
  deleteShoppingItem,
  resetListNow,
  deleteShoppingList,
  deleteEvent,
} from './actions';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'compras', label: 'Compras', icon: ShoppingCart },
  { key: 'tareas', label: 'Tareas', icon: ListTodo },
  { key: 'calendario', label: 'Calendario', icon: CalendarDays },
  { key: 'menu', label: 'Menú', icon: UtensilsCrossed },
  { key: 'fechas', label: 'Fechas', icon: Cake },
] as const;
type Tab = (typeof TABS)[number]['key'];

/**
 * Hogar: lo compartido de la casa. Una pestaña a la vez para que en el
 * celular no sea una página interminable.
 */
export default async function FamiliaPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver } = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === ver) ? (ver as Tab) : 'compras';

  const [tasks, shoppingData, members, events, mealPlan, dates] = await Promise.all([
    getTasks(),
    getShoppingData(),
    getHouseholdMembers(),
    getUpcomingEvents(),
    getMealPlan(),
    loadFamilyDates(),
  ]);

  const { lists, orphans, allItems } = shoppingData;
  const summary = summarizeFamilia(tasks, allItems);
  const nameById = new Map(members.map((m) => [m.user_id, m.full_name]));
  const counts: Record<Tab, number> = {
    compras: summary.shoppingPending,
    tareas: summary.pendingTasks,
    calendario: events.length,
    menu: 0,
    fechas: dates.upcoming.filter((u) => u.days <= 30).length,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader title="Hogar" subtitle="Compras, tareas, calendario, menú y fechas. Todo compartido con tu hogar." />

      <nav aria-label="Secciones del hogar" className="-mx-4 px-4 overflow-x-auto no-scrollbar">
        <ul className="flex gap-1.5 w-max">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <li key={t.key}>
                <Link
                  href={t.key === 'compras' ? '/familia' : `/familia?ver=${t.key}`}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 min-h-11 px-4 rounded-full text-sm font-medium whitespace-nowrap border ${
                    active ? 'bg-ink text-bg border-ink' : 'bg-surface border-line text-ink-2 hover:text-ink'
                  }`}
                >
                  <Icon size={16} /> {t.label}
                  {counts[t.key] > 0 && <span className={active ? 'text-bg/70' : 'text-ink-3'}>{counts[t.key]}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {tab === 'tareas' && (
        <section className="space-y-4" aria-label="Tareas del hogar">
          <div className="bg-surface border border-line rounded-3xl p-5">
            <TaskForm members={members} />
          </div>
          {tasks.length === 0 ? (
            <EmptyState icon={<ListTodo size={28} />} text="Sin tareas por ahora. Agrega lo que haya que hacer en la casa." />
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
      )}

      {tab === 'calendario' && (
        <section className="space-y-4" aria-label="Calendario del hogar">
          <div className="bg-surface border border-line rounded-3xl p-5">
            <EventForm />
          </div>
          {events.length === 0 ? (
            <EmptyState icon={<CalendarDays size={28} />} text="Sin eventos próximos." />
          ) : (
            <div className="space-y-2">
              {events.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </div>
          )}
          <p className="text-sm text-ink-3 px-1">Los eventos del hogar también aparecen en Hoy y en tu Semana.</p>
        </section>
      )}

      {tab === 'fechas' &&
        (dates.ready ? (
          <FamilyDates upcoming={dates.upcoming} />
        ) : (
          <p className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm text-ink-2">{WELLBEING_SQL_MISSING}</p>
        ))}

      {tab === 'menu' && (
        <section aria-label="Menú de la semana">
          <MealPlanner plan={mealPlan} />
        </section>
      )}

      {tab === 'compras' && (
        <section className="space-y-4" aria-label="Listas de compras">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {lists.map((list) => (
              <ShoppingListCard key={list.id} list={list} />
            ))}
          </div>

          {orphans.length > 0 && (
            <div className="bg-surface border border-line rounded-3xl p-5 space-y-2">
              <h3 className="text-base font-semibold text-ink">Otros</h3>
              <div className="space-y-1">
                {orphans.map((item) => (
                  <ShoppingRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {lists.length === 0 && orphans.length === 0 && (
            <EmptyState
              icon={<ShoppingCart size={28} />}
              text="Crea tu primera lista: Supermercado, Feria, Farmacia… Se pueden reiniciar solas cada semana o mes."
            />
          )}

          <details className="bg-surface border border-line rounded-3xl" open={lists.length === 0}>
            <summary className="cursor-pointer list-none min-h-12 px-5 flex items-center text-[15px] font-medium text-ink-2">
              + Nueva lista
            </summary>
            <div className="px-5 pb-5">
              <ListForm />
            </div>
          </details>
        </section>
      )}
    </div>
  );
}

function resetBadge(period: ResetPeriod) {
  if (period === 'none') return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400 border border-orange-500/20 bg-orange-500/5 px-2 py-0.5 rounded-md tracking-wide">
      <Repeat size={10} /> {period === 'weekly' ? 'Semanal' : 'Mensual'}
    </span>
  );
}

function ShoppingListCard({ list }: { list: ShoppingListWithItems }) {
  return (
    <div className="bg-surface border border-line rounded-3xl p-5 md:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <h3 className="text-base font-semibold text-ink tracking-wide truncate">{list.name}</h3>
          {resetBadge(list.reset_period)}
          <span className="text-xs tabular-nums text-ink-3">{list.pending} por comprar</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {list.items.length > 0 && (
            <form action={resetListNow}>
              <input type="hidden" name="id" value={list.id} />
              <button
                type="submit"
                title="Reiniciar (desmarcar todo)"
                aria-label={`Reiniciar ${list.name} (desmarcar todo)`}
                className="h-11 w-11 flex items-center justify-center rounded-xl text-ink-3 hover:text-ink hover:bg-surface-3"
              >
                <RotateCcw size={16} />
              </button>
            </form>
          )}
          <ConfirmAction
            action={deleteShoppingList}
            fields={{ id: list.id }}
            title={`¿Eliminar la lista "${list.name}"?`}
            message="Se borra con todos sus productos."
            confirmLabel="Eliminar"
            triggerTitle="Eliminar lista"
            triggerClassName="h-11 w-11 flex items-center justify-center rounded-xl text-ink-3 hover:text-danger hover:bg-danger/10"
          >
            <Trash2 size={16} />
            <span className="sr-only">Eliminar lista {list.name}</span>
          </ConfirmAction>
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
    <div className="flex items-center gap-1 min-h-11">
      <form action={toggleShoppingItem} className="shrink-0">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="checked" value={String(item.checked)} />
        <button
          type="submit"
          aria-label={item.checked ? `Desmarcar ${item.name}` : `Marcar ${item.name} como comprado`}
          className="h-11 w-11 -ml-2 flex items-center justify-center"
        >
          {item.checked ? (
            <CheckCircle2 size={19} className="text-emerald-400" />
          ) : (
            <Circle size={19} className="text-ink-3 hover:text-orange-400 transition-colors" />
          )}
        </button>
      </form>
      <div className="flex-1 min-w-0">
        <span className={`text-[15px] break-words ${item.checked ? 'text-ink-3 line-through' : 'text-ink'}`}>
          {item.name}
        </span>
        {item.quantity && <span className="text-xs tabular-nums text-ink-3 ml-2">{item.quantity}</span>}
      </div>
      <form action={deleteShoppingItem} className="shrink-0">
        <input type="hidden" name="id" value={item.id} />
        <button
          type="submit"
          title="Quitar"
          aria-label={`Quitar ${item.name}`}
          className="h-11 w-11 flex items-center justify-center rounded-xl text-ink-3 hover:text-danger hover:bg-danger/10"
        >
          <Trash2 size={15} />
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
    tone: 'text-ink-3',
  };
}

function EventRow({ event: e }: { event: HouseholdEvent }) {
  const w = eventWhen(e);
  return (
    <div className="flex items-center gap-3 bg-surface border border-line rounded-2xl pl-4 pr-1 py-2">
      <div className="shrink-0 h-12 w-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex flex-col items-center justify-center leading-none">
        <span className="text-base font-semibold text-sky-300 tabular-nums">{w.day}</span>
        <span className="text-xs font-semibold text-sky-400/70">{w.mon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-ink truncate">{e.title}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className={`text-xs font-semibold tracking-wide ${w.tone}`}>{w.label}</span>
          {e.event_time && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-ink-3">
              <Clock size={11} /> {e.event_time.slice(0, 5)}
            </span>
          )}
        </div>
      </div>
      <ConfirmAction
        action={deleteEvent}
        fields={{ id: e.id }}
        title="¿Eliminar este evento?"
        message="Se borra del calendario de todo el hogar."
        confirmLabel="Eliminar"
        triggerTitle="Eliminar"
        triggerClassName="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl text-ink-3 hover:text-danger hover:bg-danger/10"
      >
        <Trash2 size={16} />
        <span className="sr-only">Eliminar {e.title}</span>
      </ConfirmAction>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="border border-dashed border-line-strong rounded-3xl px-6 py-8 flex flex-col items-center justify-center text-center gap-2 text-ink-3">
      {icon}
      <p className="text-[15px] text-ink-2">{text}</p>
    </div>
  );
}
