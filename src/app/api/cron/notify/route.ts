import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendToSubscriptions, type PushRow, type PushPayload } from '@/lib/push-server';
import { phraseOfDay } from '@/lib/mindset-phrases';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Fecha de hoy (YYYY-MM-DD) en horario de Chile. */
function todayInChile(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Hora actual (0-23) en Chile. */
function hourInChile(): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Santiago',
      hour: '2-digit',
      hour12: false,
    }).format(new Date())
  );
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

type Block = 'morning' | 'afternoon' | 'night';
const M369: Record<Block, { target: number; label: string }> = {
  morning: { target: 3, label: 'de la mañana' },
  afternoon: { target: 6, label: 'de la tarde' },
  night: { target: 9, label: 'de la noche' },
};

function blockForHour(h: number): Block {
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'night';
}

interface Prefs {
  user_id: string;
  enabled: boolean;
  finanzas: boolean;
  mentalidad: boolean;
  familia: boolean;
  metas: boolean;
}

interface M369Row {
  user_id: string;
  morning: number;
  afternoon: number;
  night: number;
}

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
  // Seguridad: exige el secreto del cron.
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
  const soon = addDays(today, 3);

  // Franja: explícita por ?slot=, o según la hora de Chile.
  const slotParam = request.nextUrl.searchParams.get('slot');
  const block: Block =
    slotParam === 'morning' || slotParam === 'afternoon' || slotParam === 'night'
      ? slotParam
      : blockForHour(hourInChile());

  const phrase = phraseOfDay();

  const [{ data: prefsRows }, { data: subsRows }, { data: memberRows }, { data: m369Rows }] =
    await Promise.all([
      db.from('notification_prefs').select('*').eq('enabled', true),
      db.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth'),
      db.from('household_members').select('user_id, household_id'),
      db.from('mindset_369').select('user_id, morning, afternoon, night').eq('log_date', today),
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

  let usersNotified = 0;
  let pushesSent = 0;
  const expiredAll: string[] = [];

  for (const [userId, subs] of subsByUser) {
    const prefs = prefsByUser.get(userId);
    if (!prefs || !prefs.enabled) continue;

    const messages: PushPayload[] = [];
    const hids = householdsByUser.get(userId) || [];

    // LA FORJA — recordatorio del 369 según la franja
    if (prefs.mentalidad) {
      const row = m369ByUser.get(userId);
      const done = row ? row[block] : 0;
      const target = M369[block].target;
      if (done < target) {
        const base = `Escribe tu 369 ${M369[block].label} (${done}/${target}).`;
        messages.push({
          title: 'La Forja 🔥',
          body: block === 'morning' ? `“${phrase.text}”  ·  ${base}` : base,
          url: '/mindset/forja',
          tag: '369',
        });
      }
    }

    // PENDIENTES por módulo (cada uno con su deep-link).
    // Solo mañana y noche, para no saturar a media tarde (ahí va solo el 369).
    const pending: { text: string; url: string }[] = [];
    const withPending = block !== 'afternoon';

    if (withPending && prefs.finanzas && hids.length > 0) {
      const n = await countFor(db, () =>
        db
          .from('movements')
          .select('id', { count: 'exact', head: true })
          .in('household_id', hids)
          .eq('status', 'pending')
          .lte('due_date', today)
      );
      if (n > 0) pending.push({ text: `💰 ${n} pago${n > 1 ? 's' : ''} por confirmar`, url: '/finanzas/movimientos' });
    }

    if (withPending && prefs.mentalidad) {
      const totalHabits = await countFor(db, () =>
        db.from('habits').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true)
      );
      const doneToday = await countFor(db, () =>
        db
          .from('habit_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('log_date', today)
          .eq('done', true)
      );
      const p = Math.max(0, totalHabits - doneToday);
      if (p > 0) pending.push({ text: `🧠 ${p} hábito${p > 1 ? 's' : ''} por cumplir`, url: '/mindset' });
    }

    if (withPending && prefs.familia) {
      const n = await countFor(db, () =>
        db
          .from('household_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('assigned_to', userId)
          .eq('done', false)
          .lte('due_date', today)
      );
      if (n > 0) pending.push({ text: `🏠 ${n} tarea${n > 1 ? 's' : ''} del hogar`, url: '/familia' });
    }

    if (withPending && prefs.metas) {
      const n = await countFor(db, () =>
        db
          .from('goals')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'active')
          .gte('target_date', today)
          .lte('target_date', soon)
      );
      if (n > 0) pending.push({ text: `🎯 ${n} meta${n > 1 ? 's' : ''} por vencer`, url: '/metas' });
    }

    // Un solo pendiente → aviso directo a su pantalla. Varios → resumen al hub.
    if (pending.length === 1) {
      messages.push({ title: 'LifeHub', body: pending[0].text, url: pending[0].url, tag: 'pendientes' });
    } else if (pending.length > 1) {
      messages.push({
        title: 'Tus pendientes de hoy',
        body: pending.map((p) => p.text).join('  ·  '),
        url: '/hub',
        tag: 'pendientes',
      });
    }

    if (messages.length === 0) continue;

    let userGotOne = false;
    for (const msg of messages) {
      const { sent, expiredEndpoints } = await sendToSubscriptions(subs, msg);
      pushesSent += sent;
      if (sent > 0) userGotOne = true;
      expiredAll.push(...expiredEndpoints);
    }
    if (userGotOne) usersNotified++;
  }

  if (expiredAll.length > 0) {
    await db.from('push_subscriptions').delete().in('endpoint', expiredAll);
  }

  return NextResponse.json({
    ok: true,
    date: today,
    block,
    usersNotified,
    pushesSent,
    cleaned: expiredAll.length,
  });
}
