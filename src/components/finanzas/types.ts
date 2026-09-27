/** Datos mínimos que necesita el registro rápido (serializables al cliente). */
export interface QuickConcept {
  id: string;
  name: string;
  kind: 'income' | 'expense';
  group_name: string;
  is_debt_plan: boolean;
}

export interface QuickDebtItem {
  id: string;
  name: string;
}

export interface QuickData {
  concepts: QuickConcept[];
  debtItems: QuickDebtItem[];
  people: string[];
  /** Persona que corresponde al usuario de la sesión (preselección de "quién pagó"). */
  me: string | null;
  /** Hoy en Chile (YYYY-MM-DD). */
  today: string;
  /** Fecha por defecto al registrar: hoy, o el inicio del plan si aún no parte. */
  defaultDate: string;
}

/** Una cuenta del mes lista para mostrar (serializable al cliente). */
export interface AccountItem {
  key: string;
  kind: 'income' | 'expense';
  conceptId: string;
  debtItemId: string | null;
  label: string;
  group: string;
  amount: number;
  dueDate: string | null;
  state: 'pagado' | 'vencido' | 'vence_hoy' | 'por_pagar';
  paid: number;
  payDate: string;
  /** Persona del sueldo (para preseleccionar "De quién"). */
  person: string | null;
  /** "César · Débito · 03 oct" */
  paidInfo: string | null;
  /** Último pago registrado (para Deshacer). */
  lastPaymentId: string | null;
  /** Línea única "Deuda CMR" que agrupa las cuotas del mes. */
  isCmr?: boolean;
  /** Cuotas incluidas en la línea CMR. */
  cmrLines?: number;
  /** Lo que falta pagar de la línea CMR. */
  pendingAmount?: number;
}

/** Valores iniciales de un registro nuevo (ej. al pagar una cuenta del mes). */
export interface ExpensePreset {
  kind: 'income' | 'expense';
  concept_id: string;
  amount?: number;
  debt_item_id?: string | null;
  date?: string;
  paid_by?: string | null;
  /** Texto a mostrar en lugar del selector de concepto. */
  label?: string;
  /** true: el concepto (y el ítem) no se pueden cambiar. */
  lock?: boolean;
}

export interface ExpenseListItem {
  initial: ExpenseInitial;
  title: string;
  subtitle: string;
}

export interface ExpenseInitial {
  id: string;
  kind: 'income' | 'expense';
  amount: number;
  concept_id: string | null;
  paid_by: string | null;
  payment_method: string | null;
  date: string;
  debt_item_id: string | null;
  detail: string | null;
}
