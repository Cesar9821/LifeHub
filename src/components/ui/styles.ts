/**
 * Estilos base compartidos del UI kit. Usan los tokens de `globals.css`
 * (bg-surface, border-line, text-ink…): no poner colores sueltos aquí.
 */
export const fieldBase =
  'w-full min-h-11 bg-surface-2 border border-line-strong rounded-xl px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-3 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:opacity-50';

export const fieldInvalid = 'border-danger/60 focus:border-danger focus:ring-danger/25';

export const buttonBase =
  'inline-flex items-center justify-center gap-2 min-h-11 rounded-xl font-semibold text-sm px-5 py-2.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';

/** Tarjeta estándar: superficie sutil, borde discreto, sin sombras fuertes. */
export const cardBase = 'bg-surface border border-line rounded-3xl';

/** Botón primario (alto contraste: blanco sobre oscuro). */
export const buttonPrimary = 'bg-ink text-bg hover:bg-white';
