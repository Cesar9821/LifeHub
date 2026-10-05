import { describe, expect, it } from 'vitest';
import { canAfford, monthMoney } from './afford';

// Mes de ejemplo: $2.000.000 de ingresos, $900.000 gastados.
const money = monthMoney({
  income: 2_000_000,
  spent: 900_000,
  accounts: [
    { kind: 'expense', state: 'pagado', amount: 500_000, paid: 500_000 }, // arriendo pagado
    { kind: 'expense', state: 'por_pagar', amount: 60_000, paid: 0 }, // luz
    { kind: 'expense', state: 'vencido', amount: 250_000, paid: 100_000 }, // CMR con abono
    { kind: 'income', state: 'por_pagar', amount: 1_000_000, paid: 0 }, // sueldo: no es compromiso
  ],
  pots: [
    { budget: 400_000, spent: 250_000 }, // súper: quedan 150.000
    { budget: 100_000, spent: 130_000 }, // ocio pasado: no suma negativo
  ],
});

describe('¿Cómo estamos este mes?', () => {
  it('calcula disponible, comprometido, gastos por venir y margen', () => {
    expect(money.available).toBe(1_100_000);
    expect(money.committed).toBe(210_000);
    expect(money.variableLeft).toBe(150_000);
    expect(money.margin).toBe(740_000);
  });
});

describe('¿Puedo gastar esto?', () => {
  it('🟢 si queda el colchón (10% de ingresos = $200.000)', () => {
    const r = canAfford(money, 80_000);
    expect(r.level).toBe('si');
    expect(r.availableAfter).toBe(1_020_000);
    expect(r.marginAfter).toBe(660_000);
    expect(r.cushion).toBe(200_000);
  });

  it('🟡 si alcanza pero baja del colchón', () => {
    expect(canAfford(money, 600_000).level).toBe('ojo');
  });

  it('🔴 si no alcanza sin tocar lo comprometido', () => {
    const r = canAfford(money, 800_000);
    expect(r.level).toBe('no');
    expect(r.marginAfter).toBe(-60_000);
  });

  it('lo que cabe en el saldo del concepto no resta margen de nuevo', () => {
    const r = canAfford(money, 100_000, 150_000);
    expect(r.coveredByPot).toBe(100_000);
    expect(r.marginAfter).toBe(740_000);
    const r2 = canAfford(money, 200_000, 150_000);
    expect(r2.coveredByPot).toBe(150_000);
    expect(r2.marginAfter).toBe(690_000);
  });

  it('el límite exacto del colchón es 🟢', () => {
    expect(canAfford(money, 540_000).level).toBe('si');
    expect(canAfford(money, 540_001).level).toBe('ojo');
  });
});
