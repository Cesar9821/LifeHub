/**
 * Meses del plan como 'YYYY-MM-01'. Aritmética sin zonas horarias: solo
 * año y mes, para que el servidor (UTC) y el celular (Chile) coincidan.
 */

const SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function monthKey(year: number, month1: number): string {
  return `${year}-${String(month1).padStart(2, '0')}-01`;
}

/** Mes (YYYY-MM-01) de una fecha YYYY-MM-DD. */
export function monthOf(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number);
  const idx = y * 12 + (m - 1) + n;
  return monthKey(Math.floor(idx / 12), (idx % 12) + 1);
}

/** Lista de meses desde `from` hasta `to`, ambos incluidos. */
export function monthRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let m = from; m <= to; m = addMonths(m, 1)) out.push(m);
  return out;
}

/** "Oct 2026" */
export function monthShort(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${SHORT[m - 1]} ${y}`;
}
