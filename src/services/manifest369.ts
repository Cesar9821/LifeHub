import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { todayStr } from '@/services/mindset';

export const M369_TARGETS = { morning: 3, afternoon: 6, night: 9 } as const;
export type M369Block = keyof typeof M369_TARGETS;

export interface Manifest369 {
  affirmation: string | null;
  morning: number;
  afternoon: number;
  night: number;
}

export interface Manifest369State {
  today: Manifest369;
  /** Última afirmación usada, para prellenar si hoy aún no hay. */
  lastAffirmation: string;
  /** ¿Completó los 3 bloques hoy? */
  complete: boolean;
}

const EMPTY: Manifest369 = { affirmation: null, morning: 0, afternoon: 0, night: 0 };

export async function getToday369(): Promise<Manifest369State> {
  const supabase = await createClient();
  const user = await requireUser();
  const today = todayStr();

  const [{ data: todayRow }, { data: lastRows }] = await Promise.all([
    supabase
      .from('mindset_369')
      .select('affirmation, morning, afternoon, night')
      .eq('user_id', user.id)
      .eq('log_date', today)
      .maybeSingle(),
    supabase
      .from('mindset_369')
      .select('affirmation')
      .eq('user_id', user.id)
      .not('affirmation', 'is', null)
      .order('log_date', { ascending: false })
      .limit(1),
  ]);

  const today369 = (todayRow as Manifest369) || EMPTY;
  const lastAffirmation =
    today369.affirmation || (lastRows?.[0]?.affirmation as string) || '';

  const complete =
    today369.morning >= M369_TARGETS.morning &&
    today369.afternoon >= M369_TARGETS.afternoon &&
    today369.night >= M369_TARGETS.night;

  return { today: today369, lastAffirmation, complete };
}
