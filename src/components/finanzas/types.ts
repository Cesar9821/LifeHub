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
