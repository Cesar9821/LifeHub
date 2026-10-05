/** Áreas de vida de LifeHub. Se guardan como texto en la BD (ver SQL). */
export const AREAS = ['trabajo', 'familia', 'salud', 'habitos', 'finanzas', 'proyectos', 'personal'] as const;
export type Area = (typeof AREAS)[number];

export const AREA_LABEL: Record<Area, string> = {
  trabajo: 'Trabajo',
  familia: 'Familia',
  salud: 'Salud',
  habitos: 'Hábitos',
  finanzas: 'Finanzas',
  proyectos: 'Proyectos',
  personal: 'Personal',
};

/** Clases de color del área (puntos y bordes, nunca fondos grandes). */
export const AREA_DOT: Record<Area, string> = {
  trabajo: 'bg-area-trabajo',
  familia: 'bg-area-familia',
  salud: 'bg-area-salud',
  habitos: 'bg-area-habitos',
  finanzas: 'bg-area-finanzas',
  proyectos: 'bg-area-proyectos',
  personal: 'bg-area-personal',
};

export const AREA_BORDER: Record<Area, string> = {
  trabajo: 'border-l-area-trabajo',
  familia: 'border-l-area-familia',
  salud: 'border-l-area-salud',
  habitos: 'border-l-area-habitos',
  finanzas: 'border-l-area-finanzas',
  proyectos: 'border-l-area-proyectos',
  personal: 'border-l-area-personal',
};

export function isArea(v: unknown): v is Area {
  return typeof v === 'string' && (AREAS as readonly string[]).includes(v);
}

export function asArea(v: unknown): Area | null {
  return isArea(v) ? v : null;
}
