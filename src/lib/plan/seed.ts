/**
 * Plan inicial del hogar (Camila y César), según la especificación y el
 * Excel "Finanzas_Hogar_Camila_Cesar_final.xlsx". Se carga una sola vez.
 */

export const SEED_START = '2026-10-01';
export const SEED_MONTHS = 12; // octubre 2026 → septiembre 2027

const OCT = '2026-10-01';
const NOV = '2026-11-01';

export interface SeedConcept {
  kind: 'income' | 'expense';
  group: string;
  name: string;
  person?: string;
  isDebtPlan?: boolean;
  /** 'cuenta' = se paga una vez al mes; 'bolsa' = varios gastos. */
  payMode: 'cuenta' | 'bolsa';
  amount: (month: string) => number;
}

const fixed = (n: number) => () => n;
const onlyIn = (month: string, n: number) => (m: string) => (m === month ? n : 0);

export const SEED_CONCEPTS: SeedConcept[] = [
  // Ingresos
  { kind: 'income', group: 'Ingresos', name: 'Sueldo Camila', person: 'Camila', payMode: 'cuenta', amount: (m) => (m === OCT ? 1300000 : 1200000) },
  { kind: 'income', group: 'Ingresos', name: 'Sueldo César', person: 'César', payMode: 'cuenta', amount: fixed(850000) },
  { kind: 'income', group: 'Ingresos', name: 'Otros ingresos', payMode: 'bolsa', amount: fixed(0) },

  // Vivienda
  { kind: 'expense', group: 'Vivienda', name: 'Arriendo', payMode: 'cuenta', amount: fixed(380000) },
  { kind: 'expense', group: 'Vivienda', name: 'Gastos comunes', payMode: 'cuenta', amount: fixed(120000) },
  { kind: 'expense', group: 'Vivienda', name: 'Garantía (segunda mitad)', payMode: 'cuenta', amount: onlyIn(NOV, 190000) },

  // Servicios
  { kind: 'expense', group: 'Servicios', name: 'Luz', payMode: 'cuenta', amount: fixed(40000) },
  { kind: 'expense', group: 'Servicios', name: 'Agua', payMode: 'cuenta', amount: fixed(40000) },
  { kind: 'expense', group: 'Servicios', name: 'Gas', payMode: 'cuenta', amount: fixed(40000) },
  { kind: 'expense', group: 'Servicios', name: 'Internet / TV', payMode: 'cuenta', amount: fixed(18990) },
  { kind: 'expense', group: 'Servicios', name: 'Celulares', payMode: 'cuenta', amount: fixed(16000 + 12000) },

  // Alimentación, transporte, salud
  { kind: 'expense', group: 'Alimentación', name: 'Supermercado', payMode: 'bolsa', amount: fixed(200000) },
  { kind: 'expense', group: 'Transporte', name: 'Transporte / bencina', payMode: 'bolsa', amount: fixed(0) },
  { kind: 'expense', group: 'Salud', name: 'Farmacia y salud', payMode: 'bolsa', amount: fixed(0) },

  // Deudas
  { kind: 'expense', group: 'Deudas', name: 'CMR Camila', payMode: 'cuenta', amount: onlyIn(OCT, 251926) },
  { kind: 'expense', group: 'Deudas', name: 'CMR César', payMode: 'cuenta', amount: (m) => (m === OCT ? 100000 : 29900 + 24000) },
  { kind: 'expense', group: 'Deudas', name: 'CMR plan casa', isDebtPlan: true, payMode: 'cuenta', amount: fixed(0) },

  // Hogar y personal
  { kind: 'expense', group: 'Hogar y personal', name: 'Ocio y salidas', payMode: 'bolsa', amount: fixed(0) },
  { kind: 'expense', group: 'Hogar y personal', name: 'Imprevistos', payMode: 'bolsa', amount: fixed(50000) },
  { kind: 'expense', group: 'Hogar y personal', name: 'Cuidado Valentín y Sarah', payMode: 'cuenta', amount: fixed(100000) },
  { kind: 'expense', group: 'Hogar y personal', name: 'Otros gastos', payMode: 'bolsa', amount: onlyIn(OCT, 150000) },
];

export interface SeedDebtItem {
  name: string;
  price: number;
  installment: number;
  totalInstallments: number;
  remainingInstallments: number;
  priority: number;
}

export const SEED_DEBT: SeedDebtItem[] = [
  { name: 'GTA VI', price: 111879, installment: 20961, totalInstallments: 6, remainingInstallments: 5, priority: 1 },
  { name: 'Cama', price: 280000, installment: 23333, totalInstallments: 12, remainingInstallments: 12, priority: 2 },
  // 284.990 / 6 = 47.498,33: con decimales el saldo calza exacto con el precio.
  { name: 'Sillón', price: 284990, installment: 47498.33, totalInstallments: 6, remainingInstallments: 6, priority: 3 },
  { name: 'Lavadora', price: 279990, installment: 46665, totalInstallments: 6, remainingInstallments: 6, priority: 4 },
  { name: 'Cumpleaños Sarah', price: 122067, installment: 40689, totalInstallments: 3, remainingInstallments: 2, priority: 5 },
  { name: 'Otras cuotas CMR', price: 0, installment: 0, totalInstallments: 0, remainingInstallments: 0, priority: 6 },
];

export const SEED_SETTINGS = {
  cmr_fixed_payment: 250000,
  cmr_start_month: NOV,
  plan_start_month: SEED_START,
  people: ['Camila', 'César'],
};
