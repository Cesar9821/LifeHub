import Link from 'next/link';
import { ArrowRight, Sparkles, ListChecks } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import {
  ensureMonthGenerated,
  getMovements,
  getRecurringItems,
  periodOf,
  normalizePeriod,
  periodLabel,
  isCurrentPeriod,
} from '@/services/movements';
import { getCategoryNamesByKind } from '@/services/categories';
import { getHouseholdMembers } from '@/services/household';
import MovementRow from '@/app/finanzas/movimientos/movement-row';
import MonthSelector from '@/app/finanzas/movimientos/month-selector';
import QuickAdd from './quick-add';

export const dynamic = 'force-dynamic';

export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const period = normalizePeriod(params?.mes);

  // Genera pendientes del mes en curso o futuros (no retroactivo).
  if (period >= periodOf()) {
    await ensureMonthGenerated(period);
  }

  const [movements, categories, recurringItems, members] = await Promise.all([
    getMovements(period),
    getCategoryNamesByKind(),
    getRecurringItems(),
    getHouseholdMembers(),
  ]);

  const variableMap = new Map(recurringItems.map((r) => [r.id, r.is_variable]));
  const firstNameById = new Map(members.map((m) => [m.user_id, m.full_name.trim().split(/\s+/)[0]]));

  // A qué fecha se registran los movimientos rápidos: hoy si es el mes en curso,
  // o el primer día del mes elegido si es otro mes.
  const dueDate = isCurrentPeriod(period) ? new Date().toISOString().slice(0, 10) : period;

  const pending = movements.filter((m) => m.status === 'pending');

  const rawName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    '';
  const firstName = rawName.trim().split(/\s+/)[0] || 'Hola';

  const renderRow = (m: (typeof movements)[number]) => (
    <MovementRow
      key={m.id}
      id={m.id}
      description={m.description}
      kind={m.kind}
      category={m.category}
      estimatedAmount={m.estimated_amount}
      actualAmount={m.actual_amount}
      effectiveAmount={m.effective_amount}
      status={m.status}
      dueDate={m.due_date}
      dateState={m.date_state}
      isVariable={m.recurring_id ? variableMap.get(m.recurring_id) || false : false}
      registeredBy={m.created_by ? firstNameById.get(m.created_by) ?? null : null}
    />
  );

  return (
    <div className="min-h-screen bg-[#050608] px-5 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        {/* SALUDO */}
        <header className="space-y-1">
          <p className="text-[10px] font-black text-indigo-400/80 uppercase tracking-[0.25em]">LifeHub · Finanzas</p>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Hola, {firstName}<span className="text-indigo-500">.</span>
          </h1>
          <p className="text-sm font-medium text-slate-500">Registra rápido y sigue con tu día.</p>
        </header>

        {/* MES DESTINO + CAMBIAR MES */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
              Registrando en <span className="text-white">{periodLabel(period)}</span>
            </p>
          </div>
          <MonthSelector period={period} basePath="/inicio" />
        </div>

        {/* BOTONES GRANDES: AGREGAR INGRESO / GASTO */}
        <QuickAdd categories={categories} dueDate={dueDate} />

        {/* ENTRAR A LA APP */}
        <Link
          href="/hub"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-[2rem] border border-white/10 bg-white/5 text-slate-300 font-black text-sm uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all active:scale-95"
        >
          Entrar a la aplicación <ArrowRight size={16} />
        </Link>

        {/* PREFIJADOS DEL MES: marcar como pagado / recibido */}
        {pending.length > 0 && (
          <section className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <ListChecks size={15} className="text-emerald-400" />
              <h2 className="text-[11px] font-black text-white uppercase tracking-[0.15em]">
                Prefijados de {periodLabel(period)}
              </h2>
              <span className="text-[11px] font-bold text-slate-600">({pending.length})</span>
            </div>
            <p className="text-xs font-medium text-slate-500 -mt-1">
              Marca lo que ya pagaste o recibiste este mes.
            </p>
            <div className="space-y-2.5">{pending.map(renderRow)}</div>
          </section>
        )}
      </div>
    </div>
  );
}
