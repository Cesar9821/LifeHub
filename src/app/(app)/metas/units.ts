/** Unidades de las metas medibles y cómo se escribe cada una. */
export const UNITS = ['$', 'km', 'kg', 'libros', 'días', 'veces', 'horas'];

/** '$' → $ 500.000 · km/kg/horas → 1,3 · libros/días/veces → enteros. */
export function unitFormat(unit: string | null | undefined): { prefix?: string; suffix?: string; decimals: number } {
  if (!unit || unit === '$') return { prefix: '$', decimals: 0 };
  if (['km', 'kg', 'horas'].includes(unit)) return { suffix: unit, decimals: 2 };
  return { suffix: unit, decimals: 0 };
}
