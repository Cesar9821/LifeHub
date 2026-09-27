import { describe, expect, it } from 'vitest';
import { computeCmrPlan, type DebtItemInput } from './cmr';
import { monthRange } from './months';

// Datos de la especificación (hoja "Deuda CMR").
const ITEMS: DebtItemInput[] = [
  { id: 'gta', name: 'GTA VI', installment: 20961, remainingInstallments: 5, priority: 1 },
  { id: 'cama', name: 'Cama', installment: 23333, remainingInstallments: 12, priority: 2 },
  { id: 'sillon', name: 'Sillón', installment: 47498.33, remainingInstallments: 6, priority: 3 },
  { id: 'lava', name: 'Lavadora', installment: 46665, remainingInstallments: 6, priority: 4 },
  { id: 'sarah', name: 'Cumpleaños Sarah', installment: 40689, remainingInstallments: 2, priority: 5 },
  { id: 'otras', name: 'Otras cuotas CMR', installment: 0, remainingInstallments: 0, priority: 6 },
];

const MONTHS = monthRange('2026-10-01', '2027-09-01');

// Resultado esperado de la especificación (Nov → Mar).
const EXPECTED: Record<string, Record<string, number>> = {
  '2026-11-01': { gta: 91815, cama: 23333, sillon: 47498, lava: 46665, sarah: 40689 },
  '2026-12-01': { gta: 12990, cama: 102157, sillon: 47498, lava: 46665, sarah: 40689 },
  '2027-01-01': { gta: 0, cama: 154506, sillon: 48829, lava: 46665, sarah: 0 },
  '2027-02-01': { gta: 0, cama: 0, sillon: 141164, lava: 108836, sarah: 0 },
  '2027-03-01': { gta: 0, cama: 0, sillon: 0, lava: 31159, sarah: 0 },
};
const EXPECTED_TOTAL: Record<string, number> = {
  '2026-11-01': 250000,
  '2026-12-01': 250000,
  '2027-01-01': 250000,
  '2027-02-01': 250000,
  '2027-03-01': 31159,
};

const base = { items: ITEMS, fixedPayment: 250000, startMonth: '2026-11-01', months: MONTHS };

describe('plan CMR', () => {
  const plan = computeCmrPlan(base);
  const byMonth = new Map(plan.months.map((m) => [m.month, m]));

  it('saldo inicial total ≈ 1.031.159', () => {
    expect(plan.totalInitial).toBe(1031159);
  });

  it('reproduce la tabla esperada (±1 peso)', () => {
    for (const [month, perItem] of Object.entries(EXPECTED)) {
      const row = byMonth.get(month)!;
      for (const [id, amount] of Object.entries(perItem)) {
        expect(Math.abs(row.items[id].total - amount), `${month} ${id}`).toBeLessThanOrEqual(1);
      }
      expect(Math.abs(row.total - EXPECTED_TOTAL[month]), `${month} total`).toBeLessThanOrEqual(1);
    }
  });

  it('octubre no paga plan (solo la boleta actual, fuera del plan)', () => {
    expect(byMonth.get('2026-10-01')!.total).toBe(0);
  });

  it('la deuda termina en marzo 2027 y después no se paga nada', () => {
    expect(plan.payoffMonth).toBe('2027-03-01');
    expect(byMonth.get('2027-04-01')!.total).toBe(0);
    expect(byMonth.get('2027-03-01')!.remainingAfter).toBeLessThanOrEqual(0.5);
  });

  it('noviembre: adelanta lo que sobra de las cuotas al GTA VI (prioridad 1)', () => {
    const nov = byMonth.get('2026-11-01')!;
    expect(Math.round(nov.items.gta.advance)).toBe(70854);
    expect(nov.items.cama.advance).toBe(0);
  });

  it('se recalcula al cambiar el pago fijo', () => {
    const p = computeCmrPlan({ ...base, fixedPayment: 300000 });
    expect(Math.round(p.months.find((m) => m.month === '2026-11-01')!.total)).toBe(300000);
    expect(p.payoffMonth! < '2027-03-01').toBe(true);
  });

  it('se recalcula al cambiar el mes de inicio', () => {
    const p = computeCmrPlan({ ...base, startMonth: '2026-12-01' });
    expect(p.months.find((m) => m.month === '2026-11-01')!.total).toBe(0);
    expect(Math.round(p.months.find((m) => m.month === '2026-12-01')!.total)).toBe(250000);
  });

  it('se recalcula al cambiar la prioridad', () => {
    const items = ITEMS.map((it) =>
      it.id === 'cama' ? { ...it, priority: 0 } : it
    );
    const p = computeCmrPlan({ ...base, items });
    const nov = p.months.find((m) => m.month === '2026-11-01')!;
    expect(nov.items.cama.advance).toBeGreaterThan(0);
    expect(nov.items.gta.advance).toBe(0);
  });

  it('meses pasados usan lo pagado de verdad y el resto se recalcula', () => {
    // En noviembre solo se pagó la cuota del GTA VI (sin adelanto).
    const p = computeCmrPlan({
      ...base,
      currentMonth: '2026-12-01',
      payments: [{ itemId: 'gta', month: '2026-11-01', amount: 20961 }],
    });
    const nov = p.months.find((m) => m.month === '2026-11-01')!;
    expect(nov.source).toBe('real');
    expect(nov.total).toBe(20961);
    // Diciembre vuelve a pagar el fijo completo con los saldos reales.
    const dic = p.months.find((m) => m.month === '2026-12-01')!;
    expect(Math.round(dic.total)).toBe(250000);
    expect(p.totalPaid).toBe(20961);
  });

  it('agregar un ítem aumenta la deuda y alarga el plan', () => {
    const items = [
      ...ITEMS,
      { id: 'tv', name: 'TV', installment: 30000, remainingInstallments: 10, priority: 7 },
    ];
    const p = computeCmrPlan({ ...base, items });
    expect(p.totalInitial).toBe(1031159 + 300000);
    expect(p.payoffMonth! > '2027-03-01').toBe(true);
  });
});
