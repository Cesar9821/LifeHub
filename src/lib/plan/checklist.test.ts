import { describe, expect, it } from 'vitest';
import { buildChecklist, type ChecklistConcept, type ChecklistPayment } from './checklist';

const c = (over: Partial<ChecklistConcept> & { id: string; name: string }): ChecklistConcept => ({
  kind: 'expense',
  group: 'Vivienda',
  payMode: 'cuenta',
  dueDay: null,
  isDebtPlan: false,
  archived: false,
  ...over,
});

const CONCEPTS = [
  c({ id: 'arriendo', name: 'Arriendo', dueDay: 5 }),
  c({ id: 'luz', name: 'Luz', group: 'Servicios', dueDay: 20 }),
  c({ id: 'garantia', name: 'Garantía' }),
  c({ id: 'super', name: 'Supermercado', payMode: 'bolsa' }),
  c({ id: 'sueldo', name: 'Sueldo Camila', kind: 'income', group: 'Ingresos', dueDay: 30 }),
  c({ id: 'cmr', name: 'CMR plan casa', group: 'Deudas', isDebtPlan: true, dueDay: 10 }),
];
const BUDGET: Record<string, number> = { arriendo: 380000, luz: 40000, garantia: 0, super: 200000, sueldo: 1300000 };
const pay = (over: Partial<ChecklistPayment>): ChecklistPayment => ({
  id: 'p', conceptId: null, debtItemId: null, amount: 0, date: '2026-10-03', paidBy: 'César', method: 'debito', ...over,
});

const base = {
  month: '2026-10-01',
  today: '2026-10-12',
  concepts: CONCEPTS,
  budgetOf: (id: string) => BUDGET[id] ?? 0,
  debtLines: [
    { itemId: 'gta', name: 'GTA VI', amount: 91815 },
    { itemId: 'cama', name: 'Cama', amount: 0 },
  ],
  payments: [
    pay({ id: 'p1', conceptId: 'arriendo', amount: 380000 }),
    pay({ id: 'p2', conceptId: 'cmr', debtItemId: 'gta', amount: 91815 }),
  ],
};

describe('cuentas del mes', () => {
  const list = buildChecklist(base);
  const byKey = new Map(list.map((i) => [i.key, i]));

  it('solo incluye cuentas con monto este mes (no bolsas ni montos en 0)', () => {
    expect(byKey.has('super')).toBe(false);
    expect(byKey.has('garantia')).toBe(false);
    expect(byKey.has('arriendo')).toBe(true);
  });

  it('marca pagado cuando hay un movimiento del concepto en el mes', () => {
    expect(byKey.get('arriendo')!.state).toBe('pagado');
    expect(byKey.get('arriendo')!.paid).toBe(380000);
  });

  it('vence según el día del mes', () => {
    expect(byKey.get('luz')!.state).toBe('por_pagar'); // vence el 20
    expect(byKey.get('luz')!.dueDate).toBe('2026-10-20');
    const late = buildChecklist({ ...base, today: '2026-10-21' });
    expect(late.find((i) => i.key === 'luz')!.state).toBe('vencido');
    const onDay = buildChecklist({ ...base, today: '2026-10-20' });
    expect(onDay.find((i) => i.key === 'luz')!.state).toBe('vence_hoy');
  });

  it('una línea por cuota CMR con pago planificado', () => {
    const gta = byKey.get('cmr:gta')!;
    expect(gta.state).toBe('pagado');
    expect(gta.label).toBe('GTA VI');
    expect(byKey.has('cmr:cama')).toBe(false); // sin pago este mes
  });

  it('los ingresos también son cuentas (por recibir)', () => {
    expect(byKey.get('sueldo')!.kind).toBe('income');
    expect(byKey.get('sueldo')!.state).toBe('por_pagar');
  });

  it('un mes ya pasado con cuentas sin pagar queda vencido', () => {
    const next = buildChecklist({ ...base, today: '2026-11-02', payments: [] });
    expect(next.find((i) => i.key === 'sueldo')!.state).toBe('vencido');
  });

  it('ordena: vencidas primero, pagadas al final', () => {
    const late = buildChecklist({ ...base, today: '2026-10-21' });
    expect(late[0].state).toBe('vencido');
    expect(late[late.length - 1].state).toBe('pagado');
  });

  it('fecha sugerida: hoy si es el mes en curso, si no el vencimiento', () => {
    expect(byKey.get('luz')!.payDate).toBe('2026-10-12');
    const future = buildChecklist({ ...base, month: '2026-11-01' });
    expect(future.find((i) => i.key === 'luz')!.payDate).toBe('2026-11-20');
  });
});
