/**
 * Si la operación PRINCIPAL de una Server Action falló, registra el detalle en
 * el log del servidor y lanza para que el error boundary (`error.tsx`) muestre
 * el problema al usuario, en vez de fingir éxito y perder datos en silencio.
 *
 * Úsalo solo para la operación que ES el propósito de la action (el insert /
 * update principal). Los efectos secundarios "best-effort" (p. ej. registrar un
 * movimiento tras haber actualizado un saldo) deben seguir usando console.error
 * para no romper un flujo que ya tuvo éxito parcial.
 */
export function failIf(
  error: { message: string } | null | undefined,
  context: string
): void {
  if (error) {
    console.error(`${context}:`, error.message);
    throw new Error(`${context}. Inténtalo de nuevo.`);
  }
}
