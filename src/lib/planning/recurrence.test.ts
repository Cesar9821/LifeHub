import { describe, expect, it } from 'vitest';
import { daysLabel, expandRoutines, occursOn, planScopeEdit, type RoutineOverride, type RoutineRule } from './recurrence';

const gym: RoutineRule = {
  id: 'gym',
  title: 'Gym',
  area: 'salud',
  days_of_week: [1, 3, 5],
  start_time: '06:00',
  end_time: '07:00',
  valid_from: '2026-10-01',
  valid_until: null,
  active: true,
};
const inmade: RoutineRule = {
  id: 'inmade',
  title: 'Inmade',
  area: 'trabajo',
  days_of_week: [1, 2, 3, 4],
  start_time: '08:30',
  end_time: '18:30',
  valid_from: '2026-10-01',
  valid_until: null,
  active: true,
};
const viernes: RoutineRule = { ...inmade, id: 'viernes', days_of_week: [5], end_time: '15:30' };

const week = ['2026-10-05', '2026-10-11'] as const;

describe('rutinas recurrentes', () => {
  it('genera solo las ocurrencias de la semana, sin guardar filas', () => {
    const occ = expandRoutines([gym, inmade, viernes], [], ...week);
    expect(occ.filter((o) => o.routineId === 'gym').map((o) => o.date)).toEqual([
      '2026-10-05',
      '2026-10-07',
      '2026-10-09',
    ]);
    expect(occ.filter((o) => o.routineId === 'inmade')).toHaveLength(4);
    const vie = occ.find((o) => o.routineId === 'viernes')!;
    expect([vie.date, vie.start, vie.end]).toEqual(['2026-10-09', '08:30', '15:30']);
  });

  it('ordena por fecha y hora', () => {
    const occ = expandRoutines([inmade, gym], [], '2026-10-05', '2026-10-05');
    expect(occ.map((o) => o.title)).toEqual(['Gym', 'Inmade']);
  });

  it('respeta la vigencia y las rutinas pausadas', () => {
    expect(occursOn({ ...gym, valid_until: '2026-10-06' }, '2026-10-07')).toBe(false);
    expect(occursOn({ ...gym, valid_from: '2026-10-08' }, '2026-10-07')).toBe(false);
    expect(occursOn({ ...gym, active: false }, '2026-10-05')).toBe(false);
  });

  it('"solo esta": cambia el horario de una ocurrencia', () => {
    const ov: RoutineOverride = {
      id: 'ov1',
      routine_id: 'gym',
      occurrence_date: '2026-10-07',
      block_date: '2026-10-07',
      start_time: '19:00',
      end_time: '20:00',
      title: 'Gym (tarde)',
      area: null,
      cancelled: false,
    };
    const occ = expandRoutines([gym], [ov], ...week);
    const mie = occ.find((o) => o.occurrenceDate === '2026-10-07')!;
    expect([mie.start, mie.title, mie.overrideId, mie.area]).toEqual(['19:00', 'Gym (tarde)', 'ov1', 'salud']);
    expect(occ).toHaveLength(3);
  });

  it('"solo esta": cancelar omite la ocurrencia', () => {
    const ov: RoutineOverride = {
      id: 'ov2',
      routine_id: 'gym',
      occurrence_date: '2026-10-09',
      block_date: '2026-10-09',
      start_time: null,
      end_time: null,
      title: 'Gym',
      area: null,
      cancelled: true,
    };
    const occ = expandRoutines([gym], [ov], ...week);
    expect(occ.map((o) => o.date)).toEqual(['2026-10-05', '2026-10-07']);
  });

  it('una ocurrencia movida a otra semana aparece donde quedó', () => {
    const ov: RoutineOverride = {
      id: 'ov3',
      routine_id: 'gym',
      occurrence_date: '2026-10-02', // viernes de la semana anterior
      block_date: '2026-10-05',
      start_time: '18:00',
      end_time: '19:00',
      title: 'Gym',
      area: null,
      cancelled: false,
    };
    const occ = expandRoutines([gym], [ov], ...week);
    expect(occ.filter((o) => o.date === '2026-10-05').map((o) => o.start)).toEqual(['06:00', '18:00']);
  });

  it('plan de edición según el alcance', () => {
    expect(planScopeEdit(gym, '2026-10-07', 'solo')).toEqual({ kind: 'override', occurrenceDate: '2026-10-07' });
    expect(planScopeEdit(gym, '2026-10-07', 'desde')).toEqual({ kind: 'split', oldUntil: '2026-10-06', newFrom: '2026-10-07' });
    // Desde la primera ocurrencia equivale a toda la rutina.
    expect(planScopeEdit(gym, '2026-10-01', 'desde')).toEqual({ kind: 'all' });
    expect(planScopeEdit(gym, '2026-10-07', 'toda')).toEqual({ kind: 'all' });
  });

  it('describe los días', () => {
    expect(daysLabel([1, 3, 5])).toBe('L · Mi · V');
    expect(daysLabel([4, 3, 2, 1])).toBe('Lunes a jueves');
    expect(daysLabel([1, 2, 3, 4, 5, 6, 7])).toBe('Todos los días');
  });
});
