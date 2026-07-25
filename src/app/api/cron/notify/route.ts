import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendToSubscriptions, type PushRow } from '@/lib/push-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Fecha de hoy (YYYY-MM-DD) en horario de Chile. */
function todayInChile(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parts; // en-CA da YYYY-MM-DD
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

interface Prefs {
  user_id: string;
  enabled: boolean;
  finanzas: boolean;
  mentalidad: boolean;
  familia: boolean;
  metas: boolean;
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

  // Carga base
  const [{ data: prefsRows }, { data: subsRows }, { data: memberRows }] =
    await Promise.all([
      db.from('notification_prefs').select('*').eq('enabled', true),
      db.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth'),
      db.from('household_members').select('user_id, household_id'),
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

  let usersNotified = 0;
  let pushesSent = 0;
  const expiredAll: string[] = [];

  for (const [userId, subs] of subsByUser) {
    const prefs = prefsByUser.get(userId);
    if (!prefs || !prefs.enabled) continue;

    const lines: string[] = [];
    const hids = householdsByUser.get(userId) || [];

    // FINANZAS — pagos pendientes vencidos o de hoy
    if (prefs.finanzas && hids.length > 0) {
      const n = await countFor(db, () =>
        db
          .from('movements')
          .select('id', { count: 'exact', head: true })
          .in('household_id', hids)
          .eq('status', 'pending')
          .lte('due_date', today)
      );
      if (n > 0) lines.push(`💰 ${n} pago${n > 1 ? 's' : ''} por confirmar`);
    }

    // MENTALIDAD — hábitos que faltan hoy
    if (prefs.mentalidad) {
      const totalHabits = await countFor(db, () =>
        db
          .from('habits')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_active', true)
      );
      const doneToday = await countFor(db, () =>
        db
          .from('habit_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('log_date', today)
          .eq('done', true)
      );
      const pending = Math.max(0, totalHabits - doneToday);
      if (pending > 0) lines.push(`🧠 ${pending} hábito${pending > 1 ? 's' : ''} por cumplir`);
    }

    // FAMILIA — tareas asignadas a mí, vencidas o de hoy
    if (prefs.familia) {
      const n = await countFor(db, () =>
        db
          .from('household_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('assigned_to', userId)
          .eq('done', false)
          .lte('due_date', today)
      );
      if (n > 0) lines.push(`🏠 ${n} tarea${n > 1 ? 's' : ''} del hogar`);
    }

    // METAS — objetivos que vencen dentro de 3 días
    if (prefs.metas) {
      const n = await countFor(db, () =>
        db
          .from('goals')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'active')
          .gte('target_date', today)
          .lte('target_date', soon)
      );
      if (n > 0) lines.push(`🎯 ${n} meta${n > 1 ? 's' : ''} por vencer`);
    }

    if (lines.length === 0) continue; // nada que avisar hoy

    const { sent, expiredEndpoints } = await sendToSubscriptions(subs, {
      title: 'LifeHub — tus pendientes de hoy',
      body: lines.join('  ·  '),
      url: '/hub',
      tag: 'daily-digest',
    });

    pushesSent += sent;
    if (sent > 0) usersNotified++;
    expiredAll.push(...expiredEndpoints);
  }

  // Limpia suscripciones caducadas
  if (expiredAll.length > 0) {
    await db.from('push_subscriptions').delete().in('endpoint', expiredAll);
  }

  return NextResponse.json({
    ok: true,
    date: today,
    usersNotified,
    pushesSent,
    cleaned: expiredAll.length,
  });
}
