import { getMovements, periodOf } from './movements';
import { getHabitsWithStatus, summarizeHabits } from './mindset';
import { getTasks, getShoppingData } from './familia';
import { getGoals, summarizeGoals } from './metas';
import { formatCLP } from '@/lib/format';

/**
 * Resumen en vivo por módulo para el hub. Cada uno va en su try/catch para que
 * una tabla faltante o sin datos no rompa la pantalla de inicio.
 */
export async function getHubSummary(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};

  const jobs: [string, () => Promise<string>][] = [
    [
      'finanzas',
      async () => {
        const movs = await getMovements(periodOf());
        let balance = 0;
        let pending = 0;
        for (const m of movs) {
          if (m.status === 'confirmed') balance += m.kind === 'income' ? m.effective_amount : -m.effective_amount;
          else pending++;
        }
        const saldo = `Saldo ${formatCLP(balance)}`;
        return pending > 0 ? `${saldo} · ${pending} por confirmar` : saldo;
      },
    ],
    [
      'mentalidad',
      async () => {
        const s = summarizeHabits(await getHabitsWithStatus());
        if (s.totalHabits === 0) return 'Crea tu primer hábito';
        return `${s.doneToday}/${s.totalHabits} hábitos hoy · racha ${s.longestStreak}`;
      },
    ],
    [
      'familia',
      async () => {
        const [tasks, shopping] = await Promise.all([getTasks(), getShoppingData()]);
        const pt = tasks.filter((t) => !t.done).length;
        const sp = shopping.allItems.filter((i) => !i.checked).length;
        return `${pt} tarea${pt !== 1 ? 's' : ''} · ${sp} por comprar`;
      },
    ],
    [
      'metas',
      async () => {
        const s = summarizeGoals(await getGoals());
        if (s.active === 0) return 'Define tu primera meta';
        return `${s.active} activa${s.active !== 1 ? 's' : ''} · ${s.avgProgress}% avance`;
      },
    ],
  ];

  await Promise.all(
    jobs.map(async ([key, fn]) => {
      try {
        out[key] = await fn();
      } catch {
        /* módulo sin datos/tabla: se omite */
      }
    })
  );

  return out;
}
