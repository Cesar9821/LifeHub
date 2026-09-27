import { describe, expect, it } from 'vitest';
import { budgetStatus, contributionSplit } from './budget';
import { addMonths, monthRange, monthShort } from './months';

describe('estado del presupuesto', () => {
  it('OK bajo el 85%', () => {
    expect(budgetStatus(100000, 0)).toBe('ok');
    expect(budgetStatus(100000, 84999)).toBe('ok');
  });
  it('Cerca del límite desde el 85% hasta el 100%', () => {
    expect(budgetStatus(100000, 85000)).toBe('cerca');
    expect(budgetStatus(100000, 100000)).toBe('cerca');
  });
  it('Pasado si supera el 100%', () => {
    expect(budgetStatus(100000, 100001)).toBe('pasado');
  });
  it('Sin presupuesto si hay gasto y el presupuesto es 0', () => {
    expect(budgetStatus(0, 5000)).toBe('sin_presupuesto');
    expect(budgetStatus(0, 0)).toBe('sin_movimiento');
  });
});

describe('aporte proporcional', () => {
  it('octubre: Camila 1.300.000 y César 850.000', () => {
    const [camila, cesar] = contributionSplit(
      [
        { person: 'Camila', income: 1300000 },
        { person: 'César', income: 850000 },
      ],
      1000000
    );
    expect(camila.pct).toBeCloseTo(1300000 / 2150000, 10);
    expect(cesar.pct).toBeCloseTo(850000 / 2150000, 10);
    expect(camila.amount + cesar.amount).toBe(1000000);
    expect(camila.amount).toBe(604651);
  });
  it('sin ingresos no reparte', () => {
    const rows = contributionSplit([{ person: 'Camila', income: 0 }], 50000);
    expect(rows[0].pct).toBe(0);
    expect(rows[0].amount).toBe(0);
  });
});

describe('meses', () => {
  it('suma meses cruzando el año', () => {
    expect(addMonths('2026-12-01', 1)).toBe('2027-01-01');
    expect(addMonths('2027-01-01', -1)).toBe('2026-12-01');
  });
  it('periodo del plan: octubre 2026 a septiembre 2027', () => {
    const r = monthRange('2026-10-01', '2027-09-01');
    expect(r).toHaveLength(12);
    expect(monthShort(r[0])).toBe('Oct 2026');
    expect(monthShort(r[11])).toBe('Sep 2027');
  });
});
