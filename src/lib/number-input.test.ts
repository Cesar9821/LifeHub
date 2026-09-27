import { describe, expect, it } from 'vitest';
import { formatStored, formatTyped, parseSubmitted } from './number-input';

describe('formato al escribir', () => {
  it('pesos: miles con punto', () => {
    expect(formatTyped('100000')).toEqual({ display: '100.000', value: '100000' });
    expect(formatTyped('1.234.567')).toEqual({ display: '1.234.567', value: '1234567' });
    expect(formatTyped('')).toEqual({ display: '', value: '' });
  });

  it('sin decimales, la coma se ignora', () => {
    expect(formatTyped('1,5')).toEqual({ display: '15', value: '15' });
  });

  it('decimales con coma: 1,3', () => {
    expect(formatTyped('1,3', 2)).toEqual({ display: '1,3', value: '1.3' });
    expect(formatTyped('1', 2)).toEqual({ display: '1', value: '1' });
    expect(formatTyped('47498,33', 2)).toEqual({ display: '47.498,33', value: '47498.33' });
  });

  it('mientras se escribe la coma, se mantiene', () => {
    expect(formatTyped('7,', 1)).toEqual({ display: '7,', value: '7' });
    expect(formatTyped(',5', 1)).toEqual({ display: '0,5', value: '0.5' });
  });

  it('limita la cantidad de decimales', () => {
    expect(formatTyped('75,456', 1)).toEqual({ display: '75,4', value: '75.4' });
  });

  it('un punto escrito al final se toma como coma decimal', () => {
    expect(formatTyped('7.', 1)).toEqual({ display: '7,', value: '7' });
  });

  it('negativos solo si se permiten', () => {
    expect(formatTyped('-5000', 0, true)).toEqual({ display: '-5.000', value: '-5000' });
    expect(formatTyped('-5000')).toEqual({ display: '5.000', value: '5000' });
  });

  it('quita ceros a la izquierda', () => {
    expect(formatTyped('0050')).toEqual({ display: '50', value: '50' });
  });
});

describe('valores guardados', () => {
  it('muestra pesos y decimales en formato chileno', () => {
    expect(formatStored(380000)).toEqual({ display: '380.000', value: '380000' });
    expect(formatStored(47498.33, 2)).toEqual({ display: '47.498,33', value: '47498.33' });
    expect(formatStored(7.5, 1)).toEqual({ display: '7,5', value: '7.5' });
    expect(formatStored(null)).toEqual({ display: '', value: '' });
  });
});

describe('lectura en el servidor', () => {
  it('lee el valor limpio', () => {
    expect(parseSubmitted('47498.33')).toBe(47498.33);
    expect(parseSubmitted('1.3')).toBe(1.3);
    expect(parseSubmitted('')).toBeNull();
    expect(parseSubmitted(null)).toBeNull();
  });
});
