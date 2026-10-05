/**
 * Conflictos de horario y regla 70/30.
 *
 * Un "contenedor" es una rutina larga de trabajo (la jornada en Inmade). Lo
 * que se agenda DENTRO de la jornada y es de trabajo no choca con ella: es
 * trabajo planificado. Cualquier otra superposición sí es un conflicto.
 */
import { timeToMin } from './dates';

export interface TimedItem {
  id: string;
  title: string;
  date: string;
  start: string | null;
  end: string | null;
  area: string | null;
  /** Viene de una rutina (estructura fija de la semana). */
  routine?: boolean;
}

export interface Conflict {
  date: string;
  a: TimedItem;
  b: TimedItem;
}

export function isContainer(item: TimedItem): boolean {
  return Boolean(item.routine && item.area === 'trabajo');
}

function interval(item: TimedItem): [number, number] | null {
  if (!item.start || !item.end) return null;
  const s = timeToMin(item.start);
  const e = timeToMin(item.end);
  return e > s ? [s, e] : null;
}

/** Pares de ítems que se superponen el mismo día. */
export function findConflicts(items: TimedItem[]): Conflict[] {
  const byDate = new Map<string, TimedItem[]>();
  for (const it of items) {
    if (!interval(it)) continue;
    if (!byDate.has(it.date)) byDate.set(it.date, []);
    byDate.get(it.date)!.push(it);
  }
  const out: Conflict[] = [];
  for (const [date, list] of byDate) {
    const sorted = [...list].sort((x, y) => timeToMin(x.start!) - timeToMin(y.start!));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        const [as, ae] = interval(a)!;
        const [bs, be] = interval(b)!;
        if (bs >= ae) break; // ordenados por inicio: ya no hay más choques con `a`
        if (!(as < be && bs < ae)) continue;
        // Trabajo agendado dentro de la jornada de trabajo: no es conflicto.
        if ((isContainer(a) && b.area === 'trabajo') || (isContainer(b) && a.area === 'trabajo')) continue;
        out.push({ date, a, b });
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Regla 70/30                                                       */
/* ------------------------------------------------------------------ */

/** Objetivo: planificar como máximo el 70% del tiempo disponible. */
export const PLAN_TARGET = 0.7;
const FULL = 0.9;

export type LoadStatus = 'holgado' | 'justo' | 'lleno';

export interface DayLoad {
  /** Minutos libres después de las rutinas, dentro de la ventana del día. */
  freeMin: number;
  /** Minutos agregados (bloques/eventos) en ese tiempo libre. */
  plannedFreeMin: number;
  /** Minutos de jornada de trabajo (rutinas de trabajo). */
  workMin: number;
  /** Minutos agendados dentro de la jornada. */
  plannedWorkMin: number;
  freeRatio: number;
  workRatio: number;
  status: LoadStatus;
}

type Seg = [number, number];

function union(segs: Seg[]): Seg[] {
  const s = segs.filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  const out: Seg[] = [];
  for (const seg of s) {
    const last = out[out.length - 1];
    if (last && seg[0] <= last[1]) last[1] = Math.max(last[1], seg[1]);
    else out.push([...seg]);
  }
  return out;
}

const total = (segs: Seg[]) => segs.reduce((a, [s, e]) => a + (e - s), 0);

function intersect(a: Seg[], b: Seg[]): Seg[] {
  const out: Seg[] = [];
  for (const [as, ae] of a) for (const [bs, be] of b) {
    const s = Math.max(as, bs);
    const e = Math.min(ae, be);
    if (e > s) out.push([s, e]);
  }
  return union(out);
}

function subtract(a: Seg[], b: Seg[]): Seg[] {
  let cur = union(a);
  for (const [bs, be] of union(b)) {
    const next: Seg[] = [];
    for (const [s, e] of cur) {
      if (be <= s || bs >= e) next.push([s, e]);
      else {
        if (bs > s) next.push([s, bs]);
        if (be < e) next.push([be, e]);
      }
    }
    cur = next;
  }
  return cur;
}

/**
 * Carga de un día. Las rutinas son la estructura fija; la regla 70/30 se
 * aplica a lo que se AGREGA encima:
 *  - en el tiempo libre (ventana del día menos rutinas), y
 *  - dentro de la jornada de trabajo (para dejar espacio a urgencias).
 */
export function dayLoad(items: TimedItem[], windowStart = '06:00', windowEnd = '22:30'): DayLoad {
  const win: Seg[] = [[timeToMin(windowStart), timeToMin(windowEnd)]];
  const segOf = (it: TimedItem) => interval(it);

  const routineSegs = intersect(union(items.filter((i) => i.routine).map(segOf).filter(Boolean) as Seg[]), win);
  const workSegs = intersect(union(items.filter(isContainer).map(segOf).filter(Boolean) as Seg[]), win);
  const added = intersect(union(items.filter((i) => !i.routine).map(segOf).filter(Boolean) as Seg[]), win);

  const freeSegs = subtract(win, routineSegs);
  const freeMin = total(freeSegs);
  const workMin = total(workSegs);
  const plannedFreeMin = total(intersect(added, freeSegs));
  const plannedWorkMin = total(intersect(added, workSegs));

  const freeRatio = freeMin > 0 ? plannedFreeMin / freeMin : 0;
  const workRatio = workMin > 0 ? plannedWorkMin / workMin : 0;
  const worst = Math.max(freeRatio, workRatio);
  const status: LoadStatus = worst > FULL ? 'lleno' : worst > PLAN_TARGET ? 'justo' : 'holgado';

  return { freeMin, plannedFreeMin, workMin, plannedWorkMin, freeRatio, workRatio, status };
}
