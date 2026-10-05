import { describe, expect, it } from 'vitest';
import { pickTip, tipById, tipCategoryFor, tipCycle, TIPS, TIP_CATEGORIES } from './tips';

describe('consejos del día', () => {
  it('hay al menos 10 por tema, con ids únicos y textos cortos', () => {
    const ids = new Set(TIPS.map((t) => t.id));
    expect(ids.size).toBe(TIPS.length);
    for (const c of TIP_CATEGORIES) expect(TIPS.filter((t) => t.category === c).length).toBeGreaterThanOrEqual(10);
    for (const t of TIPS) expect(t.text.length).toBeLessThanOrEqual(120);
    expect(tipById('foco-01')?.category).toBe('foco');
  });

  it('el contexto manda: sueño, carga, plata', () => {
    const date = '2026-10-07'; // miércoles
    expect(tipCategoryFor({ date, sleepHours: 5 }).category).toBe('descanso');
    expect(tipCategoryFor({ date, todayTasks: 8 })).toEqual({ category: 'foco', reason: 'Tienes 8 cosas para hoy.' });
    expect(tipCategoryFor({ date, financeMargin: -1000 }).category).toBe('plata');
    expect(tipCategoryFor({ date, habitsPending: 3 }).category).toBe('habitos');
    expect(tipCategoryFor({ date, now: '20:00' }).category).toBe('gratitud');
  });

  it('el día de la semana también', () => {
    expect(tipCategoryFor({ date: '2026-10-05', now: '08:00' }).category).toBe('semana'); // lunes
    expect(tipCategoryFor({ date: '2026-10-09' }).category).toBe('semana'); // viernes
    expect(tipCategoryFor({ date: '2026-10-10' }).category).toBe('familia'); // sábado
    expect(tipCategoryFor({ date: '2026-10-11' }).category).toBe('descanso'); // domingo
  });

  it('es estable durante el día y cambia de un día a otro', () => {
    const a = pickTip({ date: '2026-10-07' });
    expect(pickTip({ date: '2026-10-07' }).tip.id).toBe(a.tip.id);
    expect(pickTip({ date: '2026-10-08' }).tip.id).not.toBe(a.tip.id);
  });

  it('"otro consejo" recorre todos sin repetir, partiendo por el mismo tema', () => {
    const first = TIPS[3];
    const cycle = tipCycle(first);
    expect(cycle[0]).toBe(first);
    expect(new Set(cycle.map((t) => t.id)).size).toBe(TIPS.length);
    expect(cycle[1].category).toBe(first.category);
  });
});
