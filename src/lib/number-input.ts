/**
 * Formato de números al escribir, estilo Chile: miles con punto y decimales
 * con coma (100.000 · 1,3 · 47.498,33). El formulario envía el valor limpio
 * para el servidor ("100000", "1.3", "47498.33"), que se lee con Number().
 */

export interface TypedNumber {
  /** Lo que ve la persona: "47.498,33" */
  display: string;
  /** Lo que recibe el servidor: "47498.33" ('' si está vacío) */
  value: string;
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Normaliza lo que se escribe. Los puntos son separadores de miles (se
 * ignoran); la coma es el decimal. Si se permiten decimales, un punto recién
 * escrito al final se toma como coma (teclados que no la tienen).
 */
export function formatTyped(raw: string, decimals = 0, allowNegative = false): TypedNumber {
  let s = raw.trim();
  const negative = allowNegative && s.startsWith('-');
  if (decimals > 0 && s.endsWith('.') && !s.includes(',')) s = `${s.slice(0, -1)},`;

  const commaAt = decimals > 0 ? s.indexOf(',') : -1;
  const intRaw = commaAt >= 0 ? s.slice(0, commaAt) : s;
  const decRaw = commaAt >= 0 ? s.slice(commaAt + 1) : '';

  const intDigits = intRaw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  const decDigits = decRaw.replace(/\D/g, '').slice(0, decimals);
  const hasComma = commaAt >= 0;
  const sign = negative ? '-' : '';

  if (!intDigits && !hasComma) return { display: negative ? '-' : '', value: '' };

  const intPart = intDigits || '0';
  const display = `${sign}${groupThousands(intPart)}${hasComma ? `,${decDigits}` : ''}`;
  const value = `${sign}${intPart}${decDigits ? `.${decDigits}` : ''}`;
  return { display, value };
}

/** Muestra un valor guardado (número o texto "47498.33") con formato chileno. */
export function formatStored(value: number | string | null | undefined, decimals = 0): TypedNumber {
  if (value === null || value === undefined || value === '') return { display: '', value: '' };
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return { display: '', value: '' };
  const fixed = decimals > 0 ? String(Number(n.toFixed(decimals))) : String(Math.round(n));
  const [int, dec = ''] = fixed.replace('-', '').split('.');
  const sign = n < 0 ? '-' : '';
  return {
    display: `${sign}${groupThousands(int)}${dec ? `,${dec}` : ''}`,
    value: `${sign}${int}${dec ? `.${dec}` : ''}`,
  };
}

/** Lee en el servidor el valor limpio que envía el formulario ('' → null). */
export function parseSubmitted(v: FormDataEntryValue | string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
