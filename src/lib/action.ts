import { z } from 'zod';

/**
 * Contrato único de resultado para Server Actions usadas con `useActionState`.
 * - ok:false + message         → error general (se muestra en un InlineMessage)
 * - ok:false + fieldErrors     → errores de validación por campo
 * - ok:true  + message         → éxito
 */
export interface FormState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

/** Estado inicial neutro para useActionState. */
export const IDLE_STATE: FormState = { ok: false };

export function errorState(message: string, fieldErrors?: Record<string, string>): FormState {
  return { ok: false, message, fieldErrors };
}

export function successState(message?: string): FormState {
  return { ok: true, message };
}

/**
 * Valida un FormData contra un esquema Zod.
 * Devuelve los datos tipados, o un FormState de error listo para retornar.
 */
export function parseForm<T extends z.ZodType>(
  schema: T,
  formData: FormData
):
  | { success: true; data: z.infer<T> }
  | { success: false; state: FormState } {
  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    // Los checkbox llegan como 'on'; el resto como string.
    raw[key] = value;
  }

  const result = schema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0]?.toString() ?? '_form';
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }

  return {
    success: false,
    state: errorState('Revisa los datos ingresados.', fieldErrors),
  };
}

/* ------------------------------------------------------------------ */
/*  Coerciones reutilizables para formularios (inputs siempre string) */
/* ------------------------------------------------------------------ */

/** Texto obligatorio, recortado. */
export const zRequiredText = (label = 'Este campo') =>
  z
    .string({ error: `${label} es obligatorio.` })
    .trim()
    .min(1, `${label} es obligatorio.`);

/** Texto opcional → null si viene vacío o ausente (campo no presente en el form). */
export const zOptionalText = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((v) => {
    const s = (v ?? '').toString().trim();
    return s === '' ? null : s;
  });

/** Monto en pesos: acepta string y lo pasa a número entero ≥ 0. */
export const zAmount = z
  .union([z.string(), z.number()])
  .transform((v) => Number(String(v).replace(/\./g, '')))
  .pipe(z.number({ error: 'Monto inválido.' }).min(0, 'El monto no puede ser negativo.'));

/** Fecha YYYY-MM-DD opcional → null si viene vacía o ausente. */
export const zOptionalDate = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((v) => {
    const s = (v ?? '').toString().trim();
    return s === '' ? null : s;
  })
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Fecha inválida.');

/** Checkbox 'on'/ausente → boolean. */
export const zCheckbox = z
  .union([z.literal('on'), z.undefined(), z.null(), z.string()])
  .transform((v) => v === 'on');
