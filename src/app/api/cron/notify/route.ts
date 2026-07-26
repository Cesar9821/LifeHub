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

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  const qsSecret = request.nextUrl.searchParams.get('secret');
  if (!secret || (auth !== `Bearer ${secret}` && qsSecret !== secret)) {
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

    // RESUMEN — pendientes + saldo bajo, a la hora del digest.
    if (due('digest', prefs.digest_time, sent)) {
      const pending: { text: string; url: string }[] = [];

      if (prefs.finanzas && hids.length > 0) {
        const n = await countFor(db, () =>
          db.from('movements').select('id', { count: 'exact', head: true }).in('household_id', hids).eq('status', 'pending').lte('due_date', today)
        );
        if (n > 0) pending.push({ text: `💰 ${n} pago${n > 1 ? 's' : ''} por confirmar`, url: '/finanzas/movimientos' });
      }

      if (prefs.mentalidad) {
        const total = await countFor(db, () =>
          db.from('habits').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true)
        );
        const done = await countFor(db, () =>
          db.from('habit_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('log_date', today).eq('done', true)
        );
        const p = Math.max(0, total - done);
        if (p > 0) pending.push({ text: `🧠 ${p} hábito${p > 1 ? 's' : ''} por cumplir`, url: '/mindset' });
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
        if (n > 0) pending.push({ text: `🎯 ${n} meta${n > 1 ? 's' : ''} por vencer`, url: '/metas' });
      }

      // Saldo bajo (Finanzas)
      if (prefs.low_balance_enabled && prefs.finanzas && hids.length > 0) {
        const { data: mv } = await db
          .from('movements')
          .select('kind, actual_amount, estimated_amount')
          .in('household_id', hids)
          .eq('status', 'confirmed')
          .eq('period_month', period);
        let balance = 0;
        for (const m of (mv as { kind: string; actual_amount: number | null; estimated_amount: number }[]) || []) {
          const amt = Number(m.actual_amount ?? m.estimated_amount) || 0;
          balance += m.kind === 'income' ? amt : -amt;
        }
        if (balance < Number(prefs.low_balance_threshold)) {
          await deliver(userId, subs, 'low-balance', {
            title: '💸 Saldo bajo',
            body: `Te queda ${formatCLP(balance)} este mes. Ojo con los gastos.`,
            url: '/finanzas/dashboard',
            tag: 'low-balance',
          });
        }
      }

      let payload: PushPayload | null = null;
      if (pending.length === 1) payload = { title: 'LifeHub', body: pending[0].text, url: pending[0].url, tag: 'digest' };
      else if (pending.length > 1)
        payload = { title: 'Tus pendientes de hoy', body: pending.map((p) => p.text).join('  ·  '), url: '/hub', tag: 'digest' };
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
