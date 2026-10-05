import { describe, expect, it } from 'vitest';
import { dayLoad, findConflicts, type TimedItem } from './conflicts';

const d = '2026-10-05';
const item = (id: string, start: string, end: string, area: string | null, routine = false): TimedItem => ({
  id,
  title: id,
  date: d,
  start,
  end,
  area,
  routine,
});

describe('conflictos de horario', () => {
  it('detecta superposiciones', () => {
    const c = findConflicts([item('gym', '06:00', '07:00', 'salud', true), item('dentista', '06:30', '07:30', 'salud')]);
    expect(c).toHaveLength(1);
    expect([c[0].a.id, c[0].b.id]).toEqual(['gym', 'dentista']);
  });

  it('bloques contiguos no chocan', () => {
    expect(findConflicts([item('a', '06:00', '07:00', null), item('b', '07:00', '08:30', null)])).toHaveLength(0);
  });

  it('trabajo dentro de la jornada no es conflicto; algo familiar sí', () => {
    const jornada = item('inmade', '08:30', '18:30', 'trabajo', true);
    expect(findConflicts([jornada, item('reunión proveedor', '10:00', '11:00', 'trabajo')])).toHaveLength(0);
    expect(findConflicts([jornada, item('reunión colegio', '17:00', '18:00', 'familia')])).toHaveLength(1);
  });

  it('ignora eventos sin hora y días distintos', () => {
    const allDay: TimedItem = { id: 'cumple', title: 'Cumpleaños', date: d, start: null, end: null, area: 'familia' };
    const otherDay = { ...item('x', '06:00', '07:00', null), date: '2026-10-06' };
    expect(findConflicts([allDay, item('gym', '06:00', '07:00', 'salud'), otherDay])).toHaveLength(0);
  });
});

describe('regla 70/30', () => {
  const rutinas = [
    item('gym', '06:00', '07:00', 'salud', true),
    item('inmade', '08:30', '18:30', 'trabajo', true),
    item('familia', '19:00', '21:00', 'familia', true),
  ];

  it('las rutinas son la base: un día solo con rutinas queda holgado', () => {
    const l = dayLoad(rutinas);
    // Ventana 06:00–22:30 = 990 min; rutinas = 60 + 600 + 120 = 780 → libres 210.
    expect(l.freeMin).toBe(210);
    expect(l.workMin).toBe(600);
    expect(l.plannedFreeMin).toBe(0);
    expect(l.status).toBe('holgado');
  });

  it('agendar más del 70% de la jornada la marca justa', () => {
    const reuniones = [item('r1', '09:00', '13:00', 'trabajo'), item('r2', '14:00', '17:00', 'trabajo')];
    const l = dayLoad([...rutinas, ...reuniones]);
    expect(l.plannedWorkMin).toBe(420);
    expect(l.workRatio).toBeCloseTo(0.7, 5);
    expect(l.status).toBe('holgado');
    const l2 = dayLoad([...rutinas, ...reuniones, item('r3', '17:00', '18:00', 'trabajo')]);
    expect(l2.status).toBe('justo');
  });

  it('llenar el tiempo libre la marca llena', () => {
    const extras = [item('traslado', '07:00', '08:30', 'familia'), item('estudio', '21:00', '22:30', 'personal')];
    const l = dayLoad([...rutinas, ...extras]);
    expect(l.plannedFreeMin).toBe(180);
    expect(l.status).toBe('justo');
    const l2 = dayLoad([...rutinas, ...extras, item('compras', '18:30', '19:00', 'familia')]);
    expect(l2.status).toBe('lleno');
  });

  it('superposiciones no se cuentan dos veces', () => {
    const l = dayLoad([item('a', '07:00', '08:00', null), item('b', '07:30', '08:00', null)]);
    expect(l.plannedFreeMin).toBe(60);
  });
});
