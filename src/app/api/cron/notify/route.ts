import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendToSubscriptions, type PushRow, type PushPayload } from '@/lib/push-server';
import { phraseOfDay } from '@/lib/mindset-phrases';
import { formatCLP } from '@/lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** YYYY-MM-DD de hoy en Chile. */
function todayInChile(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** "HH:MM" ahora en Chile. */
function nowHHMM(): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

interface Prefs {
  user_id: string;
  enabled: boolean;
  finanzas: boolean;
  mentalidad: boolean;
  familia: boolean;
  metas: boolean;
  forja_time: string;
  m369_morning_time: string;
  m369_afternoon_time: string;
  m369_night_time: string;
  digest_time: string;
  low_balance_enabled: boolean;
  low_balance_threshold: number;
  /** Columnas nuevas (20261005_lifehub_planning.sql): pueden no existir aún. */
  reminders?: boolean;
  review_enabled?: boolean;
  review_time?: string;
}

interface M369Row {
  user_id: string;
  morning: number;
  afternoon: number;
  night: number;
}

const M369 = {
  morning: { target: 3, label: 'de la mañana' },
  afternoon: { target: 6, label: 'de la tarde' },
  night: { target: 9, label: 'de la noche' },
} as const;

async function countFor(
  db: ReturnType<typeof createAdminClient>,
  builder: () => PromiseLike<{ count: number | null }>
): Promise<number> {
  try {
    const { count } = await builder();
    return count || 0;
  } catch {
    return 0;
  }
}

type Db = ReturnType<typeof createAdminClient>;

/**
 * Cuentas del mes (plan del hogar) que vencen hoy o ya vencieron y no se
 * han pagado. Las cuotas CMR solo cuentan desde el mes de inicio del plan.
 */
async function dueAccounts(db: Db, hids: string[], period: string, today: string): Promise<string[]> {
  try {
    const day = Number(today.slice(8, 10));
    const { data: concepts } = await db
      .from('budget_concepts')
      .select('id, name, is_debt_plan, household_id')
      .in('household_id', hids)
      .eq('kind', 'expense')
      .eq('pay_mode', 'cuenta')
      .eq('archived', false)
      .not('due_day', 'is', null)
      .lte('due_day', day);
    const list = (concepts as { id: string; name: string; is_debt_plan: boolean; household_id: string }[]) || [];
    if (list.length === 0) return [];
    const ids = list.map((c) => c.id);
    const [{ data: amounts }, { data: paid }, { data: settings }] = await Promise.all([
      db.from('budget_amounts').select('concept_id, amount').in('concept_id', ids).eq('month', period),
      db.from('movements').select('concept_id').in('concept_id', ids).eq('status', 'confirmed').eq('period_month', period),
      db.from('finance_settings').select('household_id, cmr_start_month').in('household_id', hids),
    ]);
    const budget = new Map(((amounts as { concept_id: string; amount: number }[]) || []).map((a) => [a.concept_id, Number(a.amount)]));
    const paidIds = new Set(((paid as { concept_id: string }[]) || []).map((p) => p.concept_id));
    const cmrStart = new Map(
      ((settings as { household_id: string; cmr_start_month: string }[]) || []).map((r) => [r.household_id, r.cmr_start_month])
    );
    return list
      .filter((c) => !paidIds.has(c.id))
      .filter((c) =>
        c.is_debt_plan ? (cmrStart.get(c.household_id) ?? '9999') <= period : (budget.get(c.id) ?? 0) > 0
      )
      .map((c) => c.name);
  } catch {
    return [];
  }
}

/**
 * Disponible del mes como lo muestra la app: ingresos (lo registrado de cada
 * sueldo o, si no hay registro, lo presupuestado) menos lo gastado real.
 */
async function monthAvailable(db: Db, hids: string[], period: string): Promise<number> {
  const [{ data: incomeConcepts }, { data: mv }] = await Promise.all([
    db.from('budget_concepts').select('id').in('household_id', hids).eq('kind', 'income').eq('archived', false),
    db
      .from('movements')
      .select('kind, concept_id, actual_amount, estimated_amount')
      .in('household_id', hids)
      .eq('status', 'confirmed')
      .eq('period_month', period),
  ]);
  const incomeIds = new Set(((incomeConcepts as { id: string }[]) || []).map((c) => c.id));
  const { data: amounts } =
    incomeIds.size > 0
      ? await db.from('budget_amounts').select('concept_id, amount').in('concept_id', [...incomeIds]).eq('month', period)
      : { data: [] };

  const actual = new Map<string, number>();
  let otherIncome = 0;
  let spent = 0;
  for (const m of (mv as { kind: string; concept_id: string | null; actual_amount: number | null; estimated_amount: number }[]) || []) {
    const amt = Number(m.actual_amount ?? m.estimated_amount) || 0;
    if (m.kind === 'expense') spent += amt;
    else if (m.concept_id && incomeIds.has(m.concept_id)) actual.set(m.concept_id, (actual.get(m.concept_id) ?? 0) + amt);
    else otherIncome += amt;
  }
  const budget = new Map(((amounts as { concept_id: string; amount: number }[]) || []).map((a) => [a.concept_id, Number(a.amount)]));
  let income = otherIncome;
  for (const id of incomeIds) income += (actual.get(id) ?? 0) > 0 ? actual.get(id)! : budget.get(id) ?? 0;
  return income - spent;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // Solo por header: un secreto en la URL queda en los logs.
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'no autorizado' }, { status: 401 });
  }

  let db: ReturnType<typeof createAdminClient>;
  try {
    db = createAdminClient();
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  const today = todayInChile();
  const now = nowHHMM();
  const soon = addDays(today, 3);
  const period = `${today.slice(0, 7)}-01`;
  const phrase = phraseOfDay();

  const [{ data: prefsRows }, { data: subsRows }, { data: memberRows }, { data: m369Rows }, { data: sendRows }] =
    await Promise.all([
      db.from('notification_prefs').select('*').eq('enabled', true),
      db.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth'),
      db.from('household_members').select('user_id, household_id'),
      db.from('mindset_369').select('user_id, morning, afternoon, night').eq('log_date', today),
      db.from('notification_sends').select('user_id, kind').eq('sent_date', today),
    ]);

  const prefsByUser = new Map<string, Prefs>();
  for (const p of (prefsRows as Prefs[]) || []) prefsByUser.set(p.user_id, p);

  const subsByUser = new Map<string, PushRow[]>();
  for (const s of subsRows || []) {
    const list = subsByUser.get(s.user_id) || [];
    list.push({ id: s.id, endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth });
    subsByUser.set(s.user_id, list);
  }

  const householdsByUser = new Map<string, string[]>();
  for (const m of memberRows || []) {
    const list = householdsByUser.get(m.user_id) || [];
    list.push(m.household_id);
    householdsByUser.set(m.user_id, list);
  }

  const m369ByUser = new Map<string, M369Row>();
  for (const r of (m369Rows as M369Row[]) || []) m369ByUser.set(r.user_id, r);

  const sentByUser = new Map<string, Set<string>>();
  for (const s of (sendRows as { user_id: string; kind: string }[]) || []) {
    const set = sentByUser.get(s.user_id) || new Set();
    set.add(s.kind);
    sentByUser.set(s.user_id, set);
  }

  const hhmm = (t: string) => t.slice(0, 5);
  const due = (kind: string, time: string, sent: Set<string>) => !sent.has(kind) && now >= hhmm(time);

  const newSends: { user_id: string; kind: string; sent_date: string }[] = [];
  const expiredAll: string[] = [];
  let pushesSent = 0;

  async function deliver(userId: string, subs: PushRow[], kind: string, payload: PushPayload | null) {
    newSends.push({ user_id: userId, kind, sent_date: today });
    if (!payload) return;
    const { sent, expiredEndpoints } = await sendToSubscriptions(subs, payload);
    pushesSent += sent;
    expiredAll.push(...expiredEndpoints);
  }

  // RECORDATORIOS — tareas con hora de aviso cumplida (se marcan una sola vez).
  try {
    const { data: due, error } = await db
      .from('tasks')
      .select('id, user_id, title')
      .lte('remind_at', new Date().toISOString())
      .is('reminded_at', null)
      .neq('status', 'completado')
      .limit(200);
    if (!error && due && due.length > 0) {
      for (const r of due as { id: string; user_id: string; title: string }[]) {
        const prefs = prefsByUser.get(r.user_id);
        const subs = subsByUser.get(r.user_id);
        if (!prefs?.enabled || prefs.reminders === false || !subs?.length) continue;
        const { sent, expiredEndpoints } = await sendToSubscriptions(subs, {
          title: '🔔 Recordatorio',
          body: r.title,
          url: '/hoy',
          tag: `rem-${r.id}`,
        });
        pushesSent += sent;
        expiredAll.push(...expiredEndpoints);
      }
      await db
        .from('tasks')
        .update({ reminded_at: new Date().toISOString() })
        .in('id', (due as { id: string }[]).map((r) => r.id));
    }
  } catch (e) {
    console.error('Cron recordatorios:', e);
  }

  const isSunday = new Date(`${today}T12:00:00Z`).getUTCDay() === 0;
  const weekStart = addDays(today, -6); // el lunes de esta semana (hoy es domingo)

  for (const [userId, subs] of subsByUser) {
    const prefs = prefsByUser.get(userId);
    if (!prefs || !prefs.enabled) continue;
    const sent = sentByUser.get(userId) || new Set<string>();
    const hids = householdsByUser.get(userId) || [];

    // LA FORJA — frase del día (motivación), a su hora.
    if (prefs.mentalidad && due('forja', prefs.forja_time, sent)) {
      await deliver(userId, subs, 'forja', {
        title: 'La Forja 🔥',
        body: `“${phrase.text}”  — ${phrase.source}`,
        url: '/mindset/forja',
        tag: 'forja',
      });
    }

    // 369 — cada bloque a su hora, si aún no está completo.
    const blocks: [string, string, keyof typeof M369][] = [
      ['m369_morning', prefs.m369_morning_time, 'morning'],
      ['m369_afternoon', prefs.m369_afternoon_time, 'afternoon'],
      ['m369_night', prefs.m369_night_time, 'night'],
    ];
    for (const [kind, time, block] of blocks) {
      if (!prefs.mentalidad || !due(kind, time, sent)) continue;
      const count = m369ByUser.get(userId)?.[block] ?? 0;
      const target = M369[block].target;
      await deliver(
        userId,
        subs,
        kind,
        count < target
          ? { title: 'La Forja 🔥', body: `Escribe tu 369 ${M369[block].label} (${count}/${target}).`, url: '/mindset/forja', tag: kind }
          : null
      );
    }

    // REVISIÓN SEMANAL — domingo, si aún no se hizo.
    if (isSunday && prefs.review_enabled !== false && due('review', prefs.review_time ?? '19:00', sent)) {
      let reviewed = false;
      try {
        const { data } = await db
          .from('weekly_plans')
          .select('reviewed_at')
          .eq('user_id', userId)
          .eq('week_start', weekStart)
          .maybeSingle();
        reviewed = Boolean(data?.reviewed_at);
      } catch {
        reviewed = false;
      }
      await deliver(
        userId,
        subs,
        'review',
        reviewed
          ? null
          : {
              title: '🔄 Revisión semanal',
              body: 'Dos minutos: cómo estuvo tu semana y cuál será tu prioridad.',
              url: `/semana/revision?semana=${weekStart}`,
              tag: 'review',
            }
      );
    }

    // RESUMEN — pendientes + saldo bajo, a la hora del digest.
    if (due('digest', prefs.digest_time, sent)) {
      const pending: { text: string; url: string }[] = [];

      if (prefs.finanzas && hids.length > 0) {
        const due = await dueAccounts(db, hids, period, today);
        if (due.length === 1) pending.push({ text: `💰 Falta pagar ${due[0]}`, url: '/finanzas' });
        else if (due.length > 1) pending.push({ text: `💰 ${due.length} cuentas por pagar`, url: '/finanzas' });
      }

      // Trabajo — lo que toca hoy (tareas de LifeHub 2.0; 0 si la tabla no existe).
      {
        const n = await countFor(db, () =>
          db
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('area', 'trabajo')
            .not('status', 'in', '(completado,inbox,esperando)')
            .or(`status.in.(hoy,en_curso),due_date.lte.${today}`)
        );
        if (n > 0) pending.push({ text: `💼 ${n} de trabajo hoy`, url: '/trabajo' });
      }

      if (prefs.mentalidad) {
        const total = await countFor(db, () =>
          db.from('habits').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true)
        );
        const done = await countFor(db, () =>
          db.from('habit_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('log_date', today).eq('done', true)
        );
        const p = Math.max(0, total - done);
        if (p > 0) pending.push({ text: `🧠 ${p} hábito${p > 1 ? 's' : ''} por cumplir`, url: '/habitos' });
      }

      if (prefs.familia) {
        const n = await countFor(db, () =>
          db.from('household_tasks').select('id', { count: 'exact', head: true }).eq('assigned_to', userId).eq('done', false).lte('due_date', today)
        );
        if (n > 0) pending.push({ text: `🏠 ${n} tarea${n > 1 ? 's' : ''} del hogar`, url: '/familia' });
      }

      if (prefs.metas) {
        const n = await countFor(db, () =>
          db.from('goals').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active').gte('target_date', today).lte('target_date', soon)
        );
        if (n > 0) pending.push({ text: `🎯 ${n} objetivo${n > 1 ? 's' : ''} por vencer`, url: '/metas' });
      }

      // Familia — evento de hoy/mañana
      if (prefs.familia && hids.length > 0) {
        const tomorrow = addDays(today, 1);
        const { data: evs } = await db
          .from('household_events')
          .select('title, event_date')
          .in('household_id', hids)
          .gte('event_date', today)
          .lte('event_date', tomorrow)
          .order('event_date', { ascending: true })
          .limit(1);
        const ev = (evs as { title: string; event_date: string }[] | null)?.[0];
        if (ev) {
          pending.push({ text: `📅 ${ev.title} (${ev.event_date === today ? 'hoy' : 'mañana'})`, url: '/familia' });
        }
      }

      // Saldo bajo (Finanzas)
      if (prefs.low_balance_enabled && prefs.finanzas && hids.length > 0) {
        const balance = await monthAvailable(db, hids, period);
        if (balance < Number(prefs.low_balance_threshold)) {
          await deliver(userId, subs, 'low-balance', {
            title: '💸 Saldo bajo',
            body: `Te queda ${formatCLP(balance)} este mes. Ojo con los gastos.`,
            url: '/finanzas',
            tag: 'low-balance',
          });
        }
      }

      let payload: PushPayload | null = null;
      if (pending.length === 1) payload = { title: 'LifeHub', body: pending[0].text, url: pending[0].url, tag: 'digest' };
      else if (pending.length > 1)
        payload = { title: 'Tus pendientes de hoy', body: pending.map((p) => p.text).join('  ·  '), url: '/hoy', tag: 'digest' };
      await deliver(userId, subs, 'digest', payload);
    }
  }

  if (newSends.length > 0) {
    await db.from('notification_sends').upsert(newSends, { onConflict: 'user_id,kind,sent_date', ignoreDuplicates: true });
  }
  if (expiredAll.length > 0) {
    await db.from('push_subscriptions').delete().in('endpoint', expiredAll);
  }

  return NextResponse.json({ ok: true, date: today, now, processed: newSends.length, pushesSent });
}
