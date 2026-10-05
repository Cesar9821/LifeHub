import { describe, expect, it } from 'vitest';
import {
  activityWheel,
  average,
  clampGlasses,
  daysUntil,
  nextOccurrence,
  parseWheel,
  prioritiesDoneDays,
  streak,
  streakLabel,
  turning,
  upcomingDates,
  weakestArea,
  wheelAverage,
  wheelFilled,
  whenLabel,
} from './wellbeing';

const today = '2026-10-07';

describe('rachas', () => {
  it('cuenta días seguidos hasta hoy, o hasta ayer si hoy aún no', () => {
    expect(streak(['2026-10-05', '2026-10-06', '2026-10-07'], today)).toBe(3);
    expect(streak(['2026-10-05', '2026-10-06'], today)).toBe(2);
    expect(streak(['2026-10-04', '2026-10-06'], today)).toBe(1);
    expect(streak(['2026-10-05'], today)).toBe(0);
    expect(streak([], today)).toBe(0);
  });

  it('lo importante cuenta solo si se cumplió todo', () => {
    const days = prioritiesDoneDays([
      { day: '2026-10-06', done: true },
      { day: '2026-10-06', done: true },
      { day: '2026-10-05', done: true },
      { day: '2026-10-05', done: false },
    ]);
    expect(days).toEqual(['2026-10-06']);
    expect(streakLabel(0, 'x')).toBeNull();
    expect(streakLabel(1, 'cerrando el día')).toBe('1 día cerrando el día');
    expect(streakLabel(4, 'cerrando el día')).toBe('4 días seguidos cerrando el día');
  });
});

describe('agua y sueño', () => {
  it('limita los vasos y promedia', () => {
    expect(clampGlasses(-2)).toBe(0);
    expect(clampGlasses(50)).toBe(30);
    expect(average([7, 8, null, 6.5])).toBe(7.2);
    expect(average([null, undefined])).toBeNull();
  });
});

describe('fechas especiales', () => {
  it('próxima ocurrencia, incluido hoy y el cambio de año', () => {
    expect(nextOccurrence(10, 7, today)).toBe('2026-10-07');
    expect(nextOccurrence(10, 20, today)).toBe('2026-10-20');
    expect(nextOccurrence(3, 1, today)).toBe('2027-03-01');
  });

  it('29 de febrero cae el 28 en años no bisiestos', () => {
    expect(nextOccurrence(2, 29, today)).toBe('2027-02-28');
    expect(nextOccurrence(2, 29, '2028-01-10')).toBe('2028-02-29');
  });

  it('días que faltan, años que cumple y etiqueta', () => {
    expect(daysUntil('2026-10-20', today)).toBe(13);
    expect(daysUntil('2027-01-01', '2026-12-31')).toBe(1);
    expect(turning(1990, '2026-10-20')).toBe(36);
    expect(turning(null, '2026-10-20')).toBeNull();
    expect(whenLabel(0)).toBe('Hoy');
    expect(whenLabel(1)).toBe('Mañana');
    expect(whenLabel(3)).toBe('En 3 días');
  });

  it('ordena por cercanía y filtra por ventana', () => {
    const list = upcomingDates(
      [
        { name: 'A', month: 12, day: 1 },
        { name: 'B', month: 10, day: 9, year: 2000 },
        { name: 'C', month: 10, day: 7 },
      ],
      today,
      30
    );
    expect(list.map((u) => u.item.name)).toEqual(['C', 'B']);
    expect(list[1].turning).toBe(26);
  });
});

describe('rueda de la vida', () => {
  it('lee la rueda guardada y descarta valores inválidos', () => {
    const w = parseWheel({ trabajo: 8, familia: 11, salud: '6', finanzas: 0, otra: 5 });
    expect(w.trabajo).toBe(8);
    expect(w.familia).toBeNull();
    expect(w.salud).toBe(6);
    expect(w.finanzas).toBeNull();
    expect(wheelFilled(w)).toBe(false);
    expect(parseWheel(null).trabajo).toBeNull();
  });

  it('promedio y área más baja', () => {
    const w = parseWheel({ trabajo: 8, familia: 5, salud: 6, finanzas: 7, proyectos: 3, personal: 6 });
    expect(wheelFilled(w)).toBe(true);
    expect(wheelAverage(w)).toBe(5.8);
    expect(weakestArea(w)).toBe('proyectos');
  });

  it('actividad real escalada a 0–10 con tope', () => {
    const w = activityWheel({ trabajo: 6, salud: 20, familia: 0 });
    expect(w.trabajo).toBe(5);
    expect(w.salud).toBe(10);
    expect(w.familia).toBe(0);
    expect(w.proyectos).toBe(0);
  });
});
