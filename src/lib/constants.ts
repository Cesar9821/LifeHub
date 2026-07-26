/** Constantes compartidas de LifeHub. Fuente única de verdad. */

/** Categorías sugeridas para Metas. */
export const GOAL_CATEGORIES = [
  'Personal',
  'Salud',
  'Finanzas',
  'Carrera',
  'Aprendizaje',
  'Relaciones',
] as const;

export type GoalCategory = (typeof GOAL_CATEGORIES)[number];
