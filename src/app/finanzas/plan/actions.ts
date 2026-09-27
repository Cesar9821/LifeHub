'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';
import { failIf } from '@/lib/errors';
import {
  errorState,
  parseForm,
  successState,
  zAmount,
  zOptionalText,
  zRequiredText,
  type FormState,
} from '@/lib/action';
import { addMonths, monthOf, monthRange } from '@/lib/plan/months';
import { SEED_CONCEPTS, SEED_DEBT, SEED_MONTHS, SEED_SETTINGS, SEED_START } from '@/lib/plan/seed';
import { loadPlan, monthChecklist } from '@/services/plan';

function revalidatePlan() {
  // El layout de Finanzas incluye el registro rápido: se revalida todo el módulo.
  revalidatePath('/finanzas', 'layout');
}

const zPositiveAmount = z
  .union([z.string(), z.number()])
  .transform((v) => Number(String(v).replace(/\./g, '')))
  .pipe(z.number({ error: 'Monto inválido.' }).positive('Ingresa un monto mayor a 0.'));

const zMonth = z.string().regex(/^\d{4}-\d{2}-01$/, 'Mes inválido.');

/* ------------------------------------------------------------------ */
/*  Primer arranque: limpiar datos antiguos y cargar el plan           */
/* ------------------------------------------------------------------ */

/** Tablas de Finanzas que se vacían al reiniciar (solo para este hogar). */
const OLD_FINANCE_TABLES = [
  // transactions antes que movements: así la FK deja transaction_id en null
  // y el borrado de movimientos no depende del trigger.
  'transactions',
  'movements',
  'recurring_items',
  'budgets',
  'credits',
  'fixed_expenses',
  'categories',
] as const;

export async function seedPlan(_prev: FormState, formData: FormData): Promise<FormState> {
  const wipe = formData.get('wipe') === 'on';
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const { count, error: countError } = await supabase
    .from('budget_concepts')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', householdId);
  if (countError) {
    console.error('Error revisando el plan:', countError.message);
    return errorState('Falta preparar la base de datos: corre supabase/schema-plan-hogar.sql en Supabase.');
  }
  if ((count ?? 0) > 0) return errorState('El plan del hogar ya está cargado.');

  if (wipe) {
    for (const table of OLD_FINANCE_TABLES) {
      const { error } = await supabase.from(table).delete().eq('household_id', householdId);
      if (error) {
        console.error(`Error limpiando ${table}:`, error.message);
        return errorState(`No se pudieron borrar los datos antiguos (${table}).`);
      }
    }
  }

  const { error: settingsError } = await supabase
    .from('finance_settings')
    .upsert({ household_id: householdId, ...SEED_SETTINGS, updated_at: new Date().toISOString() });
  if (settingsError) {
    console.error('Error guardando parámetros:', settingsError.message);
    return errorState('No se pudieron guardar los parámetros del plan.');
  }

  const { data: concepts, error: conceptsError } = await supabase
    .from('budget_concepts')
    .insert(
      SEED_CONCEPTS.map((c, i) => ({
        household_id: householdId,
        kind: c.kind,
        group_name: c.group,
        name: c.name,
        person: c.person ?? null,
        is_debt_plan: c.isDebtPlan ?? false,
        pay_mode: c.payMode,
        sort: i,
      }))
    )
    .select('id, name, kind');
  if (conceptsError || !concepts) {
    console.error('Error creando conceptos:', conceptsError?.message);
    return errorState('No se pudieron crear los conceptos del presupuesto.');
  }

  const months = monthRange(SEED_START, addMonths(SEED_START, SEED_MONTHS - 1));
  const idByName = new Map(concepts.map((c) => [`${c.kind}|${c.name}`, c.id as string]));
  const amountRows = SEED_CONCEPTS.filter((c) => !c.isDebtPlan).flatMap((c) =>
    months.map((month) => ({
      household_id: householdId,
      concept_id: idByName.get(`${c.kind}|${c.name}`)!,
      month,
      amount: c.amount(month),
    }))
  );
  const { error: amountsError } = await supabase.from('budget_amounts').insert(amountRows);
  if (amountsError) {
    console.error('Error cargando montos:', amountsError.message);
    return errorState('No se pudieron cargar los montos del presupuesto.');
  }

  const { error: debtError } = await supabase.from('debt_items').insert(
    SEED_DEBT.map((d) => ({
      household_id: householdId,
      name: d.name,
      price: d.price,
      installment: d.installment,
      total_installments: d.totalInstallments,
      remaining_installments: d.remainingInstallments,
      priority: d.priority,
    }))
  );
  if (debtError) {
    console.error('Error cargando deuda CMR:', debtError.message);
    return errorState('No se pudo cargar la deuda CMR.');
  }

  revalidatePlan();
  return successState('Plan del hogar cargado.');
}

/* ------------------------------------------------------------------ */
/*  Gastos e ingresos (registro rápido, edición)                       */
/* ------------------------------------------------------------------ */

const expenseSchema = z.object({
  id: zOptionalText,
  amount: zPositiveAmount,
  concept_id: z.string({ error: 'Elige un concepto.' }).trim().min(1, 'Elige un concepto.'),
  paid_by: zOptionalText,
  payment_method: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .refine(
      (v) => v === null || ['debito', 'credito_cmr', 'otra_tarjeta', 'efectivo', 'transferencia'].includes(v),
      'Medio de pago inválido.'
    ),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.'),
  debt_item_id: zOptionalText,
  detail: zOptionalText,
});

export async function saveExpense(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(expenseSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, amount, concept_id, paid_by, payment_method, date, debt_item_id, detail } = parsed.data;

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const { data: concept } = await supabase
    .from('budget_concepts')
    .select('id, name, kind, is_debt_plan')
    .eq('household_id', householdId)
    .eq('id', concept_id)
    .maybeSingle();
  if (!concept) return errorState('Revisa los datos ingresados.', { concept_id: 'Elige un concepto.' });

  let debtName: string | null = null;
  if (concept.is_debt_plan) {
    if (!debt_item_id) {
      return errorState('Revisa los datos ingresados.', { debt_item_id: 'Elige el ítem de la deuda.' });
    }
    const { data: item } = await supabase
      .from('debt_items')
      .select('name')
      .eq('household_id', householdId)
      .eq('id', debt_item_id)
      .maybeSingle();
    if (!item) return errorState('Revisa los datos ingresados.', { debt_item_id: 'Elige el ítem de la deuda.' });
    debtName = item.name;
  }

  const isExpense = concept.kind === 'expense';
  const fields = {
    kind: concept.kind,
    category: concept.name,
    concept_id: concept.id,
    debt_item_id: concept.is_debt_plan ? debt_item_id : null,
    description: detail ?? (debtName ? `${concept.name} · ${debtName}` : concept.name),
    paid_by,
    payment_method: isExpense ? payment_method : null,
    estimated_amount: amount,
    actual_amount: amount,
    due_date: date,
    period_month: monthOf(date),
  };

  if (id) {
    const { data: updated, error } = await supabase
      .from('movements')
      .update(fields)
      .eq('household_id', householdId)
      .eq('id', id)
      .select('transaction_id')
      .maybeSingle();
    if (error || !updated) {
      console.error('Error editando movimiento:', error?.message);
      return errorState('No se pudo guardar el cambio.');
    }
    // La transacción vinculada refleja el nuevo monto (el trigger solo actúa al confirmar).
    if (updated.transaction_id) {
      await supabase
        .from('transactions')
        .update({
          amount: isExpense ? -amount : amount,
          description: fields.description,
          category: fields.category,
          type: concept.kind,
        })
        .eq('id', updated.transaction_id);
    }
    revalidatePlan();
    return successState('Cambios guardados.');
  }

  const { error } = await supabase.from('movements').insert([
    {
      household_id: householdId,
      recurring_id: null,
      ...fields,
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    },
  ]);
  if (error) {
    console.error('Error registrando movimiento:', error.message);
    return errorState('No se pudo registrar.');
  }

  revalidatePlan();
  return successState(isExpense ? 'Gasto registrado.' : 'Ingreso registrado.');
}

export async function deleteExpense(formData: FormData) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const id = String(formData.get('id') || '');
  if (!id) return;
  const { error } = await supabase.from('movements').delete().eq('household_id', householdId).eq('id', id);
  failIf(error, 'No se pudo borrar el movimiento');
  revalidatePlan();
}

/* ------------------------------------------------------------------ */
/*  Presupuesto: montos y conceptos                                    */
/* ------------------------------------------------------------------ */

/** Meses del plan desde `from` (incluido) hasta el último mes con montos. */
async function planMonthsFrom(householdId: string, from: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('budget_amounts')
    .select('month')
    .eq('household_id', householdId)
    .order('month', { ascending: false })
    .limit(1);
  const last = (data?.[0]?.month as string | undefined) ?? from;
  return monthRange(from, last > from ? last : from);
}

const budgetAmountSchema = z.object({
  concept_id: zRequiredText('El concepto'),
  month: zMonth,
  amount: zAmount,
  scope: z.enum(['month', 'forward']).default('month'),
});

export async function setBudgetAmount(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(budgetAmountSchema, formData);
  if (!parsed.success) return parsed.state;
  const { concept_id, month, amount, scope } = parsed.data;

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const months = scope === 'forward' ? await planMonthsFrom(householdId, month) : [month];

  const { error } = await supabase.from('budget_amounts').upsert(
    months.map((m) => ({ household_id: householdId, concept_id, month: m, amount })),
    { onConflict: 'concept_id,month' }
  );
  if (error) {
    console.error('Error guardando presupuesto:', error.message);
    return errorState('No se pudo guardar el monto.');
  }
  revalidatePlan();
  return successState(scope === 'forward' ? 'Monto actualizado desde este mes.' : 'Monto actualizado para este mes.');
}

const zDueDay = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== '' ? Number(v) : null))
  .refine((v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 31), 'Día entre 1 y 31.');

const conceptSchema = z.object({
  kind: z.enum(['income', 'expense']).default('expense'),
  group_name: zRequiredText('El grupo'),
  name: zRequiredText('El nombre'),
  person: zOptionalText,
  pay_mode: z.enum(['cuenta', 'bolsa']).default('bolsa'),
  due_day: zDueDay,
  amount: zAmount,
  month: zMonth,
});

export async function addConcept(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(conceptSchema, formData);
  if (!parsed.success) return parsed.state;
  const { kind, group_name, name, person, pay_mode, due_day, amount, month } = parsed.data;

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const { data: last } = await supabase
    .from('budget_concepts')
    .select('sort')
    .eq('household_id', householdId)
    .order('sort', { ascending: false })
    .limit(1);

  const { data: concept, error } = await supabase
    .from('budget_concepts')
    .insert({
      household_id: householdId,
      kind,
      group_name,
      name,
      person: kind === 'income' ? person : null,
      pay_mode,
      due_day: pay_mode === 'cuenta' ? due_day : null,
      sort: Number(last?.[0]?.sort ?? 0) + 1,
    })
    .select('id')
    .single();
  if (error || !concept) {
    if (error?.code === '23505') return errorState('Ya existe un concepto con ese nombre.', { name: 'Nombre repetido.' });
    console.error('Error creando concepto:', error?.message);
    return errorState('No se pudo crear el concepto.');
  }

  const months = await planMonthsFrom(householdId, month);
  const { error: amountsError } = await supabase
    .from('budget_amounts')
    .insert(months.map((m) => ({ household_id: householdId, concept_id: concept.id, month: m, amount })));
  if (amountsError) console.error('Error cargando montos del concepto:', amountsError.message);

  revalidatePlan();
  return successState('Concepto agregado.');
}

/** Edita nombre, grupo, tipo (cuenta/bolsa) y día de vencimiento de un concepto. */
export async function updateConcept(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(
    z.object({
      id: zRequiredText('El concepto'),
      name: zRequiredText('El nombre'),
      group_name: zRequiredText('El grupo'),
      pay_mode: z.enum(['cuenta', 'bolsa']).default('bolsa'),
      due_day: zDueDay,
    }),
    formData
  );
  if (!parsed.success) return parsed.state;
  const { id, name, group_name, pay_mode, due_day } = parsed.data;

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const { error } = await supabase
    .from('budget_concepts')
    .update({ name, group_name, pay_mode, due_day: pay_mode === 'cuenta' ? due_day : null })
    .eq('household_id', householdId)
    .eq('id', id);
  if (error) {
    if (error.code === '23505') return errorState('Ya existe un concepto con ese nombre.', { name: 'Nombre repetido.' });
    console.error('Error renombrando concepto:', error.message);
    return errorState('No se pudo renombrar.');
  }
  // Los movimientos muestran la categoría con el nombre nuevo.
  await supabase.from('movements').update({ category: name }).eq('household_id', householdId).eq('concept_id', id);

  revalidatePlan();
  return successState('Concepto actualizado.');
}

export async function setConceptArchived(formData: FormData) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const id = String(formData.get('id') || '');
  const archived = formData.get('archived') === 'true';
  if (!id) return;
  const { error } = await supabase
    .from('budget_concepts')
    .update({ archived })
    .eq('household_id', householdId)
    .eq('id', id);
  failIf(error, 'No se pudo archivar el concepto');
  revalidatePlan();
}

/** Agrega un mes al final del plan copiando los montos del último mes. */
export async function extendPlan() {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const { data } = await supabase
    .from('budget_amounts')
    .select('concept_id, month, amount')
    .eq('household_id', householdId)
    .order('month', { ascending: false });
  if (!data || data.length === 0) return;
  const last = data[0].month as string;
  const next = addMonths(last, 1);
  const rows = data
    .filter((r) => r.month === last)
    .map((r) => ({ household_id: householdId, concept_id: r.concept_id, month: next, amount: r.amount }));
  const { error } = await supabase.from('budget_amounts').upsert(rows, { onConflict: 'concept_id,month' });
  failIf(error, 'No se pudo agregar el mes');
  revalidatePlan();
}

/* ------------------------------------------------------------------ */
/*  Deuda CMR                                                          */
/* ------------------------------------------------------------------ */

/** Paga de una vez todas las cuotas CMR pendientes del mes (cuota + adelanto del plan). */
export async function payCmrMonth(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(
    z.object({ month: zMonth, paid_by: zOptionalText, payment_method: zOptionalText, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
    formData
  );
  if (!parsed.success) return parsed.state;
  const { month, paid_by, payment_method, date } = parsed.data;

  const plan = await loadPlan();
  const concept = plan.concepts.find((c) => c.is_debt_plan);
  if (!concept) return errorState('No existe el concepto CMR plan casa.');
  const pending = monthChecklist(plan, month).filter((i) => i.debtItemId && i.state !== 'pagado' && i.amount > 0);
  if (pending.length === 0) return successState('Las cuotas del mes ya están pagadas.');

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const { error } = await supabase.from('movements').insert(
    pending.map((i) => ({
      household_id: householdId,
      recurring_id: null,
      kind: 'expense',
      category: concept.name,
      concept_id: concept.id,
      debt_item_id: i.debtItemId,
      description: `${concept.name} · ${i.label}`,
      paid_by,
      payment_method,
      estimated_amount: i.amount,
      actual_amount: i.amount,
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      due_date: date,
      period_month: month,
    }))
  );
  if (error) {
    console.error('Error pagando cuotas CMR:', error.message);
    return errorState('No se pudieron registrar las cuotas.');
  }
  revalidatePlan();
  return successState(`${pending.length} cuotas pagadas.`);
}

export async function saveCmrSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(
    z.object({
      cmr_fixed_payment: zAmount,
      cmr_start_month: zMonth,
    }),
    formData
  );
  if (!parsed.success) return parsed.state;

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const { error } = await supabase
    .from('finance_settings')
    .upsert({ household_id: householdId, ...parsed.data, updated_at: new Date().toISOString() });
  if (error) {
    console.error('Error guardando parámetros CMR:', error.message);
    return errorState('No se pudieron guardar los parámetros.');
  }
  revalidatePlan();
  return successState('Plan recalculado.');
}

const debtItemSchema = z.object({
  id: zOptionalText,
  name: zRequiredText('El nombre'),
  price: zAmount,
  // Viene limpio del input con formato ("47498.33"): puede traer centavos.
  installment: z.coerce.number({ error: 'Cuota inválida.' }).min(0, 'La cuota no puede ser negativa.'),
  total_installments: z.coerce.number({ error: 'Número inválido.' }).int().min(0),
  remaining_installments: z.coerce.number({ error: 'Número inválido.' }).int().min(0),
  priority: z.coerce.number({ error: 'Número inválido.' }).int().min(0),
});

export async function saveDebtItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(debtItemSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ...fields } = parsed.data;
  if (fields.remaining_installments > fields.total_installments) {
    return errorState('Revisa los datos ingresados.', {
      remaining_installments: 'No pueden quedar más cuotas que el total.',
    });
  }

  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const { error } = id
    ? await supabase.from('debt_items').update(fields).eq('household_id', householdId).eq('id', id)
    : await supabase.from('debt_items').insert({ household_id: householdId, ...fields });
  if (error) {
    console.error('Error guardando ítem de deuda:', error.message);
    return errorState('No se pudo guardar el ítem.');
  }
  revalidatePlan();
  return successState(id ? 'Ítem actualizado.' : 'Ítem agregado.');
}

export async function archiveDebtItem(formData: FormData) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();
  const id = String(formData.get('id') || '');
  if (!id) return;
  const { error } = await supabase
    .from('debt_items')
    .update({ archived: true })
    .eq('household_id', householdId)
    .eq('id', id);
  failIf(error, 'No se pudo archivar el ítem');
  revalidatePlan();
}
