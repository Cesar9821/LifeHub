import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';
import { getHouseholdMembers } from '@/services/household';
import { todayStr } from '@/lib/format';
import { computeCmrPlan, initialBalanceOf, type CmrPlanResult } from '@/lib/plan/cmr';
import { budgetStatus, contributionSplit, type BudgetStatus, type Contribution } from '@/lib/plan/budget';
import { addMonths, monthOf, monthRange } from '@/lib/plan/months';
import { methodLabel } from '@/components/finanzas/labels';
import type { ExpenseListItem, QuickData } from '@/components/finanzas/types';

/* ------------------------------------------------------------------ */
/*  Tipos                                                             */
/* ------------------------------------------------------------------ */

export interface PlanSettings {
  cmrFixedPayment: number;
  cmrStartMonth: string;
  planStartMonth: string;
  people: string[];
}

export const DEFAULT_SETTINGS: PlanSettings = {
  cmrFixedPayment: 250000,
  cmrStartMonth: '2026-11-01',
  planStartMonth: '2026-10-01',
  people: ['Camila', 'César'],
};

export interface Concept {
  id: string;
  kind: 'income' | 'expense';
  group_name: string;
  name: string;
  person: string | null;
  is_debt_plan: boolean;
  sort: number;
  archived: boolean;
}

export interface DebtItem {
  id: string;
  name: string;
  price: number;
  installment: number;
  total_installments: number;
  remaining_installments: number;
  priority: number;
  archived: boolean;
}

export type PaymentMethod = 'debito' | 'credito_cmr' | 'otra_tarjeta' | 'efectivo' | 'transferencia';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'debito', label: 'Débito' },
  { value: 'credito_cmr', label: 'Crédito CMR' },
  { value: 'otra_tarjeta', label: 'Otra tarjeta' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
];

export interface PlanMovement {
  id: string;
  kind: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  month: string;
  concept_id: string | null;
  debt_item_id: string | null;
  paid_by: string | null;
  payment_method: PaymentMethod | null;
  created_by: string | null;
  created_at: string;
}

export interface PlanData {
  /** false si aún no se corre schema-plan-hogar.sql en Supabase. */
  schemaReady: boolean;
  /** false si el hogar aún no tiene conceptos (primer arranque). */
  seeded: boolean;
  settings: PlanSettings;
  concepts: Concept[];
  debtItems: DebtItem[];
  /** conceptId → mes → monto */
  amounts: Map<string, Map<string, number>>;
  movements: PlanMovement[];
  months: string[];
  currentMonth: string;
  cmr: CmrPlanResult;
}

/* ------------------------------------------------------------------ */
/*  Carga                                                             */
/* ------------------------------------------------------------------ */

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message ?? '');
}

/** Mes en curso según la hora de Chile. */
export function currentMonth(): string {
  return monthOf(todayStr());
}

/** Una sola carga por request (el layout y la página la comparten). */
export const loadPlan = cache(async (): Promise<PlanData> => {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const nowMonth = currentMonth();

  const [settingsRes, conceptsRes, amountsRes, debtRes] = await Promise.all([
    supabase.from('finance_settings').select('*').eq('household_id', householdId).maybeSingle(),
    supabase.from('budget_concepts').select('*').eq('household_id', householdId).order('sort').order('name'),
    supabase.from('budget_amounts').select('concept_id, month, amount').eq('household_id', householdId),
    supabase.from('debt_items').select('*').eq('household_id', householdId).order('priority'),
  ]);

  const schemaReady = ![settingsRes.error, conceptsRes.error, amountsRes.error, debtRes.error].some(isMissingTable);
  for (const r of [settingsRes, conceptsRes, amountsRes, debtRes]) {
    if (r.error && !isMissingTable(r.error)) console.error('Error cargando plan:', r.error.message);
  }

  const s = settingsRes.data as Record<string, unknown> | null;
  const settings: PlanSettings = s
    ? {
        cmrFixedPayment: Number(s.cmr_fixed_payment),
        cmrStartMonth: String(s.cmr_start_month),
        planStartMonth: String(s.plan_start_month),
        people: (s.people as string[]) ?? DEFAULT_SETTINGS.people,
      }
    : DEFAULT_SETTINGS;

  const concepts = ((conceptsRes.data as Concept[]) ?? []).map((c) => ({ ...c, sort: Number(c.sort) }));
  const debtItems = ((debtRes.data as DebtItem[]) ?? []).map((d) => ({
    ...d,
    price: Number(d.price),
    installment: Number(d.installment),
    total_installments: Number(d.total_installments),
    remaining_installments: Number(d.remaining_installments),
    priority: Number(d.priority),
  }));

  const amounts = new Map<string, Map<string, number>>();
  let lastAmountMonth = settings.planStartMonth;
  for (const a of (amountsRes.data as { concept_id: string; month: string; amount: number }[]) ?? []) {
    if (!amounts.has(a.concept_id)) amounts.set(a.concept_id, new Map());
    amounts.get(a.concept_id)!.set(a.month, Number(a.amount));
    if (a.month > lastAmountMonth) lastAmountMonth = a.month;
  }

  // Meses del plan: desde el inicio hasta el último mes con montos (mínimo 12).
  const minEnd = addMonths(settings.planStartMonth, 11);
  const months = monthRange(settings.planStartMonth, lastAmountMonth > minEnd ? lastAmountMonth : minEnd);

  // Movimientos confirmados del periodo del plan (los pendientes no son gasto real).
  let movements: PlanMovement[] = [];
  if (schemaReady) {
    const { data, error } = await supabase
      .from('movements')
      .select(
        'id, kind, description, estimated_amount, actual_amount, due_date, period_month, concept_id, debt_item_id, paid_by, payment_method, created_by, created_at'
      )
      .eq('household_id', householdId)
      .eq('status', 'confirmed')
      .gte('period_month', settings.planStartMonth)
      .order('due_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) console.error('Error cargando movimientos del plan:', error.message);
    movements = ((data as Record<string, unknown>[]) ?? []).map((m) => ({
      id: m.id as string,
      kind: m.kind as 'income' | 'expense',
      description: m.description as string,
      amount: Number(m.actual_amount ?? m.estimated_amount),
      date: m.due_date as string,
      month: m.period_month as string,
      concept_id: (m.concept_id as string) ?? null,
      debt_item_id: (m.debt_item_id as string) ?? null,
      paid_by: (m.paid_by as string) ?? null,
      payment_method: (m.payment_method as PaymentMethod) ?? null,
      created_by: (m.created_by as string) ?? null,
      created_at: m.created_at as string,
    }));
  }

  const cmr = computeCmrPlan({
    items: debtItems
      .filter((d) => !d.archived)
      .map((d) => ({
        id: d.id,
        name: d.name,
        installment: d.installment,
        remainingInstallments: d.remaining_installments,
        priority: d.priority,
      })),
    fixedPayment: settings.cmrFixedPayment,
    startMonth: settings.cmrStartMonth,
    months,
    currentMonth: nowMonth,
    payments: movements
      .filter((m) => m.kind === 'expense' && m.debt_item_id)
      .map((m) => ({ itemId: m.debt_item_id!, month: m.month, amount: m.amount })),
  });

  return {
    schemaReady,
    seeded: concepts.length > 0,
    settings,
    concepts,
    debtItems,
    amounts,
    movements,
    months,
    currentMonth: nowMonth,
    cmr,
  };
});

/** Mes a mostrar por defecto: el actual, pero nunca antes del inicio del plan. */
export function defaultMonth(plan: PlanData, requested?: string): string {
  if (requested && /^\d{4}-\d{2}(-01)?$/.test(requested)) return `${requested.slice(0, 7)}-01`;
  return plan.currentMonth < plan.settings.planStartMonth ? plan.settings.planStartMonth : plan.currentMonth;
}

/* ------------------------------------------------------------------ */
/*  Vistas calculadas                                                 */
/* ------------------------------------------------------------------ */

/** Presupuesto de un concepto en un mes (CMR plan casa sale del plan CMR). */
export function conceptBudget(plan: PlanData, concept: Concept, month: string): number {
  if (concept.is_debt_plan) {
    const row = plan.cmr.months.find((m) => m.month === month);
    return row ? Math.round(row.total) : 0;
  }
  return plan.amounts.get(concept.id)?.get(month) ?? 0;
}

export interface ConceptRow {
  concept: Concept;
  budget: number;
  spent: number;
  remaining: number;
  /** 0..n (1 = 100%) */
  used: number;
  status: BudgetStatus;
}

export interface GroupRows {
  group: string;
  rows: ConceptRow[];
  budget: number;
  spent: number;
}

export interface IncomeRow {
  concept: Concept;
  budget: number;
  actual: number;
  /** Lo que se usa como ingreso del mes: lo registrado si existe, si no el presupuesto. */
  used: number;
}

export interface MonthView {
  month: string;
  isPast: boolean;
  isCurrent: boolean;
  incomes: IncomeRow[];
  otherIncome: number;
  income: number;
  groups: GroupRows[];
  /** Gasto real sin concepto asignado. */
  unassignedSpent: number;
  expenseBudget: number;
  spent: number;
  /** Ingresos − gastado real. */
  available: number;
  alerts: ConceptRow[];
  /** Deudas del mes (grupo "Deudas", incluye el plan CMR). */
  debtPayment: number;
  contributions: Contribution[];
  movements: PlanMovement[];
}

export function monthView(plan: PlanData, month: string): MonthView {
  const monthMovs = plan.movements.filter((m) => m.month === month);
  const byConcept = new Map<string, number>();
  let unassignedSpent = 0;
  let otherIncome = 0;
  for (const m of monthMovs) {
    if (m.concept_id) byConcept.set(m.concept_id, (byConcept.get(m.concept_id) ?? 0) + m.amount);
    else if (m.kind === 'expense') unassignedSpent += m.amount;
    else otherIncome += m.amount;
  }

  const active = plan.concepts.filter((c) => !c.archived || byConcept.has(c.id));

  const incomes: IncomeRow[] = active
    .filter((c) => c.kind === 'income')
    .map((c) => {
      const budget = conceptBudget(plan, c, month);
      const actual = byConcept.get(c.id) ?? 0;
      return { concept: c, budget, actual, used: actual > 0 ? actual : budget };
    });
  const income = incomes.reduce((a, r) => a + r.used, 0) + otherIncome;

  const groupsMap = new Map<string, GroupRows>();
  for (const c of active.filter((c) => c.kind === 'expense')) {
    const budget = conceptBudget(plan, c, month);
    const spent = byConcept.get(c.id) ?? 0;
    const row: ConceptRow = {
      concept: c,
      budget,
      spent,
      remaining: budget - spent,
      used: budget > 0 ? spent / budget : 0,
      status: budgetStatus(budget, spent),
    };
    if (!groupsMap.has(c.group_name)) groupsMap.set(c.group_name, { group: c.group_name, rows: [], budget: 0, spent: 0 });
    const g = groupsMap.get(c.group_name)!;
    g.rows.push(row);
    g.budget += budget;
    g.spent += spent;
  }
  const groups = [...groupsMap.values()];
  const allRows = groups.flatMap((g) => g.rows);

  const expenseBudget = groups.reduce((a, g) => a + g.budget, 0);
  const spent = groups.reduce((a, g) => a + g.spent, 0) + unassignedSpent;

  const debtPayment = groups.filter((g) => g.group === 'Deudas').reduce((a, g) => a + g.budget, 0);

  // Aporte proporcional: sueldos con persona asignada sobre los gastos presupuestados.
  const contributions = contributionSplit(
    plan.settings.people.map((person) => ({
      person,
      income: incomes.filter((r) => r.concept.person === person).reduce((a, r) => a + r.used, 0),
    })),
    expenseBudget
  );

  return {
    month,
    isPast: month < plan.currentMonth,
    isCurrent: month === plan.currentMonth,
    incomes,
    otherIncome,
    income,
    groups,
    unassignedSpent,
    expenseBudget,
    spent,
    available: income - spent,
    alerts: allRows.filter((r) => r.status === 'cerca' || r.status === 'pasado' || r.status === 'sin_presupuesto'),
    debtPayment,
    contributions,
    movements: monthMovs,
  };
}

export interface YearRow {
  month: string;
  income: number;
  expenseBudget: number;
  spent: number;
  /** Real si el mes ya cerró; proyectado con el presupuesto si es el actual o futuro. */
  balance: number;
  projected: boolean;
  accumulated: number;
  debtPayment: number;
  /** 0..1 */
  debtPct: number;
  contributions: Contribution[];
}

export function yearView(plan: PlanData): YearRow[] {
  let accumulated = 0;
  return plan.months.map((month) => {
    const v = monthView(plan, month);
    const projected = !v.isPast;
    const balance = projected ? v.income - Math.max(v.expenseBudget, v.spent) : v.income - v.spent;
    accumulated += balance;
    return {
      month,
      income: v.income,
      expenseBudget: v.expenseBudget,
      spent: v.spent,
      balance,
      projected,
      accumulated,
      debtPayment: v.debtPayment,
      debtPct: v.income > 0 ? v.debtPayment / v.income : 0,
      contributions: v.contributions,
    };
  });
}

/** Ahorro acumulado de los meses ya cerrados antes de `month` (saldo real). */
export function savedBefore(plan: PlanData, month: string): number {
  return plan.months
    .filter((m) => m < month && m < plan.currentMonth)
    .reduce((acc, m) => {
      const v = monthView(plan, m);
      return acc + (v.income - v.spent);
    }, 0);
}

/* ------------------------------------------------------------------ */
/*  Registro rápido y lista de movimientos                             */
/* ------------------------------------------------------------------ */

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Persona del plan que corresponde a un nombre de usuario ("Cesar Castro" → "César"). */
export function personFor(plan: PlanData, fullName: string | null | undefined): string | null {
  const first = fold((fullName ?? '').split(/\s+/)[0] ?? '');
  if (!first) return null;
  return plan.settings.people.find((p) => fold(p) === first) ?? null;
}

/**
 * Todo lo que necesita una pantalla del plan: datos, nombres de quienes
 * registran, el registro rápido y el hogar (para el tiempo real).
 */
export const loadPlanPage = cache(async () => {
  const [plan, members, householdId] = await Promise.all([
    loadPlan(),
    getHouseholdMembers(),
    getActiveHouseholdId(),
  ]);
  const me = members.find((m) => m.is_me);
  const registrantById = new Map(members.map((m) => [m.user_id, m.full_name.trim().split(/\s+/)[0]]));
  return {
    plan,
    householdId,
    registrantById,
    myName: me?.full_name ?? '',
    quick: quickData(plan, personFor(plan, me?.full_name)),
  };
});

export function quickData(plan: PlanData, me: string | null): QuickData {
  return {
    concepts: plan.concepts
      .filter((c) => !c.archived)
      .map((c) => ({ id: c.id, name: c.name, kind: c.kind, group_name: c.group_name, is_debt_plan: c.is_debt_plan })),
    debtItems: plan.debtItems.filter((d) => !d.archived).map((d) => ({ id: d.id, name: d.name })),
    people: plan.settings.people,
    me,
    today: todayStr(),
  };
}

export function expenseListItems(
  plan: PlanData,
  movements: PlanMovement[],
  registrantById: Map<string, string>
): ExpenseListItem[] {
  const conceptById = new Map(plan.concepts.map((c) => [c.id, c]));
  const debtById = new Map(plan.debtItems.map((d) => [d.id, d]));
  return movements.map((m) => {
    const concept = m.concept_id ? conceptById.get(m.concept_id) : undefined;
    const debt = m.debt_item_id ? debtById.get(m.debt_item_id) : undefined;
    const defaultTitle = concept ? (debt ? `${concept.name} · ${debt.name}` : concept.name) : m.description;
    const detail = m.description !== defaultTitle ? m.description : null;
    const registrant = m.created_by ? registrantById.get(m.created_by) : undefined;
    const subtitle = [
      detail ? concept?.name ?? 'Sin concepto' : null,
      m.paid_by,
      methodLabel(m.payment_method),
      registrant ? `registró ${registrant}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    return {
      title: m.description,
      subtitle: subtitle || (concept ? concept.group_name : 'Sin concepto'),
      initial: {
        id: m.id,
        kind: m.kind,
        amount: m.amount,
        concept_id: m.concept_id,
        paid_by: m.paid_by,
        payment_method: m.payment_method,
        date: m.date,
        debt_item_id: m.debt_item_id,
        detail,
      },
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Deuda CMR                                                         */
/* ------------------------------------------------------------------ */

export interface DebtItemView {
  item: DebtItem;
  initial: number;
  paid: number;
  balance: number;
  remainingInstallments: number;
  interest: number;
  status: 'Pagado' | 'Pendiente' | 'Completar';
  thisMonth: { installment: number; advance: number; total: number };
}

export function debtItemsView(plan: PlanData, month: string): DebtItemView[] {
  const row = plan.cmr.months.find((m) => m.month === month);
  return plan.debtItems
    .filter((d) => !d.archived)
    .map((item) => {
      const initial = initialBalanceOf({ installment: item.installment, remainingInstallments: item.remaining_installments });
      const paid = plan.movements
        .filter((m) => m.debt_item_id === item.id && m.kind === 'expense')
        .reduce((a, m) => a + m.amount, 0);
      const balance = Math.max(0, initial - paid);
      const interest = Math.max(0, Math.round(item.installment * item.total_installments - item.price));
      // Sin cuota ni saldo = ítem por completar (ej. "Otras cuotas CMR").
      const status: DebtItemView['status'] =
        initial === 0 && item.installment === 0 ? 'Completar' : balance <= 0.5 ? 'Pagado' : 'Pendiente';
      const tm = row?.items[item.id];
      return {
        item,
        initial,
        paid,
        balance,
        remainingInstallments: item.installment > 0 ? Math.ceil(balance / item.installment - 1e-9) : 0,
        interest,
        status,
        thisMonth: {
          installment: Math.round(tm?.installment ?? 0),
          advance: Math.round(tm?.advance ?? 0),
          total: Math.round(tm?.total ?? 0),
        },
      };
    });
}
