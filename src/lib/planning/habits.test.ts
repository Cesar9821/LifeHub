import { describe, expect, it } from 'vitest';
import { frequencyLabel, isHabitDueOn, isPendingToday, weekDone, weeklyTarget, type HabitRule } from './habits';

const diario: HabitRule = { frequency: 'daily', target_per_week: 7, days_of_week: null };
const gym: HabitRule = { frequency: 'daily', target_per_week: 7, days_of_week: [1, 3, 5] };
const lectura: HabitRule = { frequency: 'weekly', target_per_week: 3, days_of_week: null };

describe('hábitos', () => {
  it('días específicos', () => {
    expect(isHabitDueOn(gym, '2026-10-05')).toBe(true); // lunes
    expect(isHabitDueOn(gym, '2026-10-06')).toBe(false); // martes
    expect(isHabitDueOn(diario, '2026-10-06')).toBe(true);
  });

  it('meta semanal según el tipo', () => {
    expect(weeklyTarget(diario)).toBe(7);
    expect(weeklyTarget(gym)).toBe(3);
    expect(weeklyTarget(lectura)).toBe(3);
  });

  it('cuenta lo hecho en la semana', () => {
    const done = new Set(['2026-10-05', '2026-10-07', '2026-10-12']);
    expect(weekDone(done, '2026-10-05')).toBe(2);
  });

  it('un semanal cumplido no queda pendiente', () => {
    expect(isPendingToday(lectura, false, 3, '2026-10-08')).toBe(false);
    expect(isPendingToday(lectura, false, 2, '2026-10-08')).toBe(true);
    expect(isPendingToday(gym, false, 0, '2026-10-06')).toBe(false); // martes no toca
    expect(isPendingToday(diario, true, 5, '2026-10-06')).toBe(false);
  });

  it('describe la frecuencia', () => {
    expect(frequencyLabel(gym)).toBe('L · Mi · V');
    expect(frequencyLabel(lectura)).toBe('3 veces por semana');
    expect(frequencyLabel(diario)).toBe('Todos los días');
  });
});
