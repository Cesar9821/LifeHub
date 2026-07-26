/**
 * Frases para encender el día — inspiradas en los principios de Brian Tracy
 * (claridad, disciplina, "cómete la rana") e Ilia Topuria (autocreencia,
 * visualización, mentalidad de campeón). Son paráfrasis originales de sus ideas.
 */
export interface Phrase {
  text: string;
  source: string;
}

export const PHRASES: Phrase[] = [
  { text: 'Cómete la rana: haz primero lo más difícil e importante del día.', source: 'Principio de Brian Tracy' },
  { text: 'La claridad es poder. Define con exactitud qué quieres y ve por ello.', source: 'Principio de Brian Tracy' },
  { text: 'Lo que se repite cada día se vuelve identidad, no deseo.', source: 'Método 369' },
  { text: 'El campeón gana en su mente antes de ganar afuera.', source: 'En la línea de Ilia Topuria' },
  { text: 'La disciplina no se negocia: es la libertad de los que llegan lejos.', source: 'Mentalidad de campeón' },
  { text: 'Cree tan fuerte que la duda no encuentre espacio para entrar.', source: 'En la línea de Ilia Topuria' },
  { text: 'No cuentes las horas. Haz que las horas cuenten por ti.', source: 'Principio de Brian Tracy' },
  { text: 'La constancia vence al talento cuando el talento no es constante.', source: 'Mentalidad de forja' },
  { text: 'Visualiza tu victoria hasta que sea inevitable. Después, ejecútala.', source: 'En la línea de Ilia Topuria' },
  { text: 'Cada día que reescribes tu meta, la grabas más hondo en ti.', source: 'Método 369' },
  { text: 'Empieza donde estás, con lo que tienes. El resto se construye.', source: 'Principio de Brian Tracy' },
  { text: 'Nadie decide por ti quién eres. Tu mente es tuya. Fórjala.', source: 'Mentalidad inquebrantable' },
  { text: 'Los excelentes no son especiales: son consistentes en lo básico.', source: 'Principio de Brian Tracy' },
  { text: 'La presión es un privilegio. Respira, y demuestra quién eres.', source: 'En la línea de Ilia Topuria' },
  { text: 'Tres, seis, nueve: intención, enfoque y acción hasta que sea tuyo.', source: 'Método 369' },
  { text: 'Tu palabra contigo mismo vale más que cualquier promesa a otro.', source: 'Mentalidad de campeón' },
];

/** Día del año (1-366) para elegir una frase estable durante todo el día. */
function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

export function phraseOfDay(date = new Date()): Phrase {
  return PHRASES[dayOfYear(date) % PHRASES.length];
}
