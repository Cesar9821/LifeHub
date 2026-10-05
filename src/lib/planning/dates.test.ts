import { describe, expect, it } from 'vitest';
import {
  daysBetween,
  durationLabel,
  greetingFor,
  isoDow,
  longDateLabel,
  minToTime,
  timeToMin,
  weekDates,
  weekRangeLabel,
  weekStartOf,
} from './dates';

describe('fechas de la planificación', () => {
  it('lunes 5 de octubre de 2026 es día ISO 1', () => {
    expect(isoDow('2026-10-05')).toBe(1);
    expect(isoDow('2026-10-11')).toBe(7);
  });

  it('la semana parte el lunes, también desde el domingo', () => {
    expect(weekStartOf('2026-10-11')).toBe('2026-10-05');
    expect(weekStartOf('2026-10-05')).toBe('2026-10-05');
    expect(weekStartOf('2026-10-01')).toBe('2026-09-28');
  });

  it('weekDates entrega lunes a domingo', () => {
    const d = weekDates('2026-09-28');
    expect(d).toHaveLength(7);
    expect(d[0]).toBe('2026-09-28');
    expect(d[6]).toBe('2026-10-04');
  });

  it('convierte horas y duraciones', () => {
    expect(timeToMin('06:30')).toBe(390);
    expect(timeToMin('08:30:00')).toBe(510);
    expect(minToTime(390)).toBe('06:30');
    expect(durationLabel(90)).toBe('1 h 30 min');
    expect(durationLabel(60)).toBe('1 h');
    expect(durationLabel(45)).toBe('45 min');
  });

  it('etiquetas en español de Chile', () => {
    expect(longDateLabel('2026-10-05')).toBe('Lunes 5 de octubre');
    expect(weekRangeLabel('2026-10-05')).toBe('5 – 11 oct');
    expect(weekRangeLabel('2026-09-28')).toBe('28 sep – 4 oct');
    expect(daysBetween('2026-10-05', '2026-10-12')).toBe(7);
  });

  it('saluda según la hora', () => {
    expect(greetingFor('06:10')).toBe('Buenos días');
    expect(greetingFor('15:00')).toBe('Buenas tardes');
    expect(greetingFor('22:00')).toBe('Buenas noches');
    expect(greetingFor('02:00')).toBe('Buenas noches');
  });
});
