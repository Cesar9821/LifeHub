/**
 * Consejos del día: cortos, concretos y para hacer hoy. Se eligen según cómo
 * viene tu día (carga, sueño, plata, hábitos, día de la semana); si no hay
 * nada especial, rotan por tema. Todo es puro y determinista (sin BD).
 */
import { todayStr } from './format';

export const TIP_CATEGORIES = [
  'foco',
  'disciplina',
  'habitos',
  'familia',
  'plata',
  'descanso',
  'salud',
  'mentalidad',
  'trabajo',
  'gratitud',
  'semana',
] as const;
export type TipCategory = (typeof TIP_CATEGORIES)[number];

export const TIP_CATEGORY_LABEL: Record<TipCategory, string> = {
  foco: 'Foco',
  disciplina: 'Disciplina',
  habitos: 'Hábitos',
  familia: 'Familia',
  plata: 'Plata',
  descanso: 'Descanso',
  salud: 'Salud',
  mentalidad: 'Mentalidad',
  trabajo: 'Trabajo',
  gratitud: 'Gratitud',
  semana: 'Tu semana',
};

export const TIP_CATEGORY_EMOJI: Record<TipCategory, string> = {
  foco: '🎯',
  disciplina: '🔥',
  habitos: '🔁',
  familia: '🏠',
  plata: '💰',
  descanso: '🌙',
  salud: '💪',
  mentalidad: '🧠',
  trabajo: '💼',
  gratitud: '🙏',
  semana: '🗓️',
};

export interface Tip {
  id: string;
  category: TipCategory;
  text: string;
  /** Principio o autor de la idea (paráfrasis propia), si corresponde. */
  source?: string;
}

const T = (category: TipCategory, list: (string | [string, string])[]): Tip[] =>
  list.map((item, i) => {
    const [text, source] = Array.isArray(item) ? item : [item, undefined];
    return { id: `${category}-${String(i + 1).padStart(2, '0')}`, category, text, source };
  });

export const TIPS: Tip[] = [
  ...T('foco', [
    ['Cómete la rana: parte por lo más difícil e importante, antes de revisar el celular.', 'Principio de Brian Tracy'],
    'Si todo es importante, nada lo es. Elige tres cosas y deja que el resto espere.',
    ['Trabaja 25 minutos sin interrupciones y descansa 5. Repite. Lo difícil se vuelve chico.', 'Técnica Pomodoro'],
    'Silencia las notificaciones una hora. Lo urgente de verdad te va a encontrar igual.',
    'Antes de partir algo, escribe cómo se ve "terminado". Así sabes cuándo parar.',
    'Una pestaña, una tarea. Cerrar lo demás también es avanzar.',
    'Agrupa lo parecido: todas las llamadas juntas, todos los correos juntos.',
    ['Si algo toma menos de dos minutos, hazlo ahora y sácalo de tu cabeza.', 'Regla de los 2 minutos (David Allen)'],
    'Pregúntate: ¿qué es lo único que, si lo hago hoy, hace todo lo demás más fácil?',
    'Las mañanas son para crear; las tardes, para responder.',
    'No tienes que tener ganas para empezar. Empieza y las ganas llegan.',
  ]),
  ...T('disciplina', [
    'La disciplina es elegir entre lo que quieres ahora y lo que más quieres.',
    'Hazlo aunque sea en versión mínima: 10 minutos cuentan más que cero.',
    'No rompas la cadena dos días seguidos. Fallar un día pasa; dos, se vuelve costumbre.',
    'La motivación va y viene. El sistema se queda: deja todo listo la noche anterior.',
    'Cumple primero la promesa que te hiciste a ti mismo.',
    'Lo que haces cada día pesa más que lo que haces de vez en cuando.',
    'Cuando cueste, reduce el tamaño, no el compromiso.',
    'Termina lo que empezaste antes de abrir algo nuevo.',
    'El cansancio se pasa durmiendo; el arrepentimiento, no. Haz la parte difícil.',
    'Ponte una hora de inicio, no solo de término.',
  ]),
  ...T('habitos', [
    'Ata el hábito nuevo a uno que ya tienes: "después del café, leo 5 páginas".',
    'Haz que lo bueno sea fácil: deja la ropa de deporte a la vista.',
    'Haz que lo malo sea difícil: el celular fuera de la pieza en la noche.',
    ['No apuntes a la meta, apunta a ser la persona que la logra.', 'Idea de James Clear'],
    'Un hábito pequeño hecho todos los días le gana a uno grande que nunca empieza.',
    'Celebra cada vez que cumples, aunque sea con un "bien hecho" en voz baja.',
    'Si fallaste ayer, hoy no es para compensar: es para volver.',
    'Pocos hábitos y bien hechos. Si tienes muchos, pausa uno.',
    'Mide lo que quieres mejorar: lo que se anota, mejora.',
    'El mejor momento para un hábito es el mismo momento todos los días.',
  ]),
  ...T('familia', [
    'Diez minutos sin pantallas con los tuyos valen más que una hora a medias.',
    'Pregunta "¿qué fue lo mejor de tu día?" en la comida. Escucha la respuesta completa.',
    'Un mensaje corto a alguien que quieres puede cambiarle el día. Mándalo ahora.',
    'Las tareas de la casa se sienten livianas cuando se reparten. Conversen la lista.',
    'Planifiquen juntos el fin de semana: algo para descansar y algo para disfrutar.',
    'Agradece algo concreto a tu pareja hoy. Lo concreto se siente de verdad.',
    'Llega a la casa y deja el trabajo en la puerta. Respira antes de entrar.',
    'Los niños recuerdan los momentos, no los regalos. Inventa uno simple hoy.',
    'Llama a tus papás o a alguien mayor de la familia. No necesitas un motivo.',
    'Una comida sin celulares en la mesa es un regalo para todos.',
  ]),
  ...T('plata', [
    'Antes de comprar algo que no estaba en el plan, espera 24 horas.',
    'Págate primero: aparta el ahorro apenas llega el sueldo, no lo que sobre.',
    'Revisa tus suscripciones: lo que no usaste el mes pasado, cancélalo.',
    'Registra el gasto apenas lo haces. Al final del mes no te vas a acordar.',
    'La tarjeta de crédito es un medio de pago, no plata extra.',
    'Un fondo de emergencia te compra tranquilidad. Parte con poco, pero parte.',
    'Gasta en lo que te importa y recorta sin culpa en lo que no.',
    'Antes de un gasto grande pregúntate: ¿cuántas horas de trabajo me cuesta?',
    'Las compras chicas repetidas son las que más suman. Mira tus "hormiga".',
    'Conversen la plata en familia con calma, no solo cuando falta.',
  ]),
  ...T('descanso', [
    'Dormir bien no es flojera: es la base de todo lo que quieres lograr.',
    'Deja el celular lejos de la cama. Tu sueño te lo va a agradecer.',
    'Acostarte a la misma hora es tan importante como levantarte temprano.',
    'Haz una pausa real cada 90 minutos: camina, mira lejos, toma agua.',
    'Descansar también es productivo. Agenda tus ratos libres como cualquier compromiso.',
    'Si dormiste poco, baja la vara hoy: lo importante y nada más.',
    'Una siesta corta, de 20 minutos, recarga sin dejarte pesado.',
    'El fin de semana es para recargar, no para ponerte al día con todo.',
    'Menos cafeína después de las 3 de la tarde, mejor sueño en la noche.',
    'Escribe lo que te preocupa antes de dormir. Sacarlo de la cabeza ayuda a soltarlo.',
  ]),
  ...T('salud', [
    'Toma un vaso de agua al despertar, antes del café.',
    'Camina 10 minutos después de almorzar. Ayuda a la digestión y a la cabeza.',
    'Muévete un poco cada hora: pararse también cuenta.',
    'Prepara la colación de mañana hoy. Comer bien es más fácil con un plan.',
    'Sube por la escalera cuando puedas. Son minutos de ejercicio gratis.',
    'Respira profundo 5 veces: inhala en 4, sostén 4, exhala en 6.',
    'La comida del día parte en la lista del supermercado.',
    'Sal a la luz natural en la mañana: ordena tu reloj interno.',
    'El ejercicio no tiene que ser perfecto, tiene que ser hoy.',
    'Escucha a tu cuerpo: cansancio, dolor y estrés también son información.',
  ]),
  ...T('mentalidad', [
    ['El campeón gana en su mente antes de ganar afuera.', 'En la línea de Ilia Topuria'],
    'Compárate con quien eras ayer, no con lo que otros muestran en redes.',
    'Los errores son datos, no sentencias. ¿Qué aprendiste?',
    'No controlas todo lo que pasa, pero sí cómo respondes. Ahí está tu poder.',
    ['La claridad es poder: define con exactitud qué quieres.', 'Principio de Brian Tracy'],
    'Visualiza cómo se ve tu día bien hecho. Después, ve y hazlo.',
    'Lo que te dices a ti mismo importa. Háblate como a un buen amigo.',
    'Un mal momento no es un mal día. Un mal día no es una mala vida.',
    'Si estás estancado, cambia algo pequeño: el lugar, la hora o el primer paso.',
    'La confianza no llega antes de actuar: llega después de hacerlo varias veces.',
  ]),
  ...T('trabajo', [
    'Lo que depende de otros, márcalo como Esperando y haz seguimiento con fecha.',
    'Confirma por escrito lo que se acordó en una reunión. Ahorra malentendidos.',
    'Antes de una reunión, define qué decisión tiene que salir de ahí.',
    'Responde lo urgente, agenda lo importante y elimina lo que no aporta.',
    'Deja anotado dónde quedaste antes de irte. Mañana partes más rápido.',
    'Una instalación bien coordinada parte el día anterior: materiales, ruta y contacto.',
    'Di "no" a lo que no te corresponde, con respeto y con una alternativa.',
    'Termina el día revisando qué queda para mañana. Cinco minutos bastan.',
    'Pide ayuda antes de que el problema crezca. Avisar a tiempo es profesional.',
    'Reconoce el buen trabajo de tu equipo en voz alta.',
  ]),
  ...T('gratitud', [
    'Anota tres cosas buenas de hoy, por chicas que sean.',
    'Agradece a alguien que normalmente das por hecho.',
    'Piensa en un problema que ya no tienes. Eso también es avanzar.',
    'La gratitud cambia el foco: de lo que falta a lo que ya tienes.',
    'Cierra el día con una victoria: ¿qué hiciste bien hoy?',
    'Disfruta algo simple hoy con atención: un café, una conversación, una canción.',
    'Escribe un mensaje de agradecimiento sin esperar respuesta.',
    'Mira atrás un año: ¿qué lograste que entonces parecía difícil?',
    'Agradecer no es conformarse: es tomar impulso desde lo que sí funciona.',
    'Hoy alguien hizo algo por ti. ¿Se lo dijiste?',
  ]),
  ...T('semana', [
    'Lunes: elige el foco de la semana y las tres cosas que no pueden faltar.',
    'Revisa la semana completa antes de empezarla: choques de horario, cumpleaños, pagos.',
    'Deja espacio libre en la semana. Los imprevistos siempre llegan.',
    'Viernes: cierra lo abierto y deja anotado lo que pasa a la próxima semana.',
    'Domingo: dos minutos de revisión valen más que una semana improvisada.',
    'Planifica primero lo que te importa (familia, salud) y después llena con lo demás.',
    'Mitad de semana: ¿vas bien con tu foco? Ajusta sin culpa.',
    'Una semana buena no es la más llena, es la que avanzó en lo importante.',
    'Agenda tus hábitos como compromisos: tienen día y hora.',
    'Mira tu semana con la regla 70/30: deja aire para respirar.',
  ]),
];

const BY_ID = new Map(TIPS.map((t) => [t.id, t]));

export function tipById(id: string): Tip | undefined {
  return BY_ID.get(id);
}

/** Lo que se sabe del día para elegir un consejo que calce. Todo es opcional. */
export interface TipContext {
  date?: string;
  /** Hora actual HH:MM (Chile). */
  now?: string;
  /** Tareas para hoy (abiertas). */
  todayTasks?: number;
  /** Hábitos que faltan hoy. */
  habitsPending?: number;
  /** Margen libre del mes (puede ser negativo). */
  financeMargin?: number | null;
  /** Horas dormidas anoche. */
  sleepHours?: number | null;
}

export interface TipPick {
  tip: Tip;
  /** Por qué se eligió (para mostrarlo con honestidad), o null si es la rotación del día. */
  reason: string | null;
}

function dayIndex(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

function isoDow(date: string): number {
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  return dow === 0 ? 7 : dow;
}

/** Elige la categoría según el contexto (la primera regla que calza gana). */
export function tipCategoryFor(ctx: TipContext): { category: TipCategory; reason: string | null } {
  const date = ctx.date ?? todayStr();
  const dow = isoDow(date);
  const now = ctx.now ?? '12:00';
  if (ctx.sleepHours != null && ctx.sleepHours < 6) return { category: 'descanso', reason: 'Dormiste poco anoche.' };
  if ((ctx.todayTasks ?? 0) >= 7) return { category: 'foco', reason: `Tienes ${ctx.todayTasks} cosas para hoy.` };
  if (ctx.financeMargin != null && ctx.financeMargin < 0) return { category: 'plata', reason: 'El mes viene apretado.' };
  if (now >= '19:00') return { category: 'gratitud', reason: null };
  if (dow === 1 && now < '14:00') return { category: 'semana', reason: 'Es lunes: buen día para ordenar la semana.' };
  if (dow === 5) return { category: 'semana', reason: 'Es viernes: buen día para cerrar la semana.' };
  if (dow === 7) return { category: 'descanso', reason: 'Es domingo.' };
  if (dow === 6) return { category: 'familia', reason: 'Es sábado.' };
  if ((ctx.habitsPending ?? 0) >= 3) return { category: 'habitos', reason: `Te faltan ${ctx.habitsPending} hábitos hoy.` };
  // Rotación: un tema distinto cada día (sin repetir el de ayer).
  const rotation: TipCategory[] = ['foco', 'mentalidad', 'salud', 'disciplina', 'trabajo', 'habitos', 'familia', 'plata'];
  return { category: rotation[dayIndex(date) % rotation.length], reason: null };
}

/** El consejo del día: misma elección durante todo el día para el mismo contexto. */
export function pickTip(ctx: TipContext = {}): TipPick {
  const date = ctx.date ?? todayStr();
  const { category, reason } = tipCategoryFor({ ...ctx, date });
  const list = TIPS.filter((t) => t.category === category);
  // Avanza por la lista con un paso primo para no repetir días seguidos.
  const tip = list[(dayIndex(date) * 7) % list.length];
  return { tip, reason };
}

/** Orden para "Otro consejo": primero los del mismo tema, después el resto. */
export function tipCycle(first: Tip): Tip[] {
  const same = TIPS.filter((t) => t.category === first.category && t.id !== first.id);
  const others = TIPS.filter((t) => t.category !== first.category);
  const start = TIPS.indexOf(first);
  const rotate = (l: Tip[]) => {
    const k = start % Math.max(1, l.length);
    return [...l.slice(k), ...l.slice(0, k)];
  };
  return [first, ...rotate(same), ...rotate(others)];
}
