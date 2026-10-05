import Link from 'next/link';
import { ArrowRight, Swords } from 'lucide-react';
import { todayStr } from '@/lib/format';
import { longDateLabel } from '@/lib/planning/dates';
import { getTodayLog } from '@/services/mindset';
import { phraseOfDay } from '@/lib/mindset-phrases';
import { PageHeader } from '@/components/ui/card';
import DailyPanel from './daily-panel';

export const dynamic = 'force-dynamic';

/**
 * Registro diario: ánimo, sueño, energía y agua (alimenta la revisión
 * semanal). Los hábitos están en /habitos y "lo importante" en Hoy.
 */
export default async function RegistroDiarioPage() {
  const todayLog = await getTodayLog();
  const phrase = phraseOfDay();

  return (
    <div className="space-y-5">
      <PageHeader title="Registro diario" subtitle={longDateLabel(todayStr())} />

      <Link
        href="/mindset/forja"
        className="flex items-center gap-4 rounded-3xl bg-surface border border-line p-5 hover:border-line-strong"
      >
        <span className="h-10 w-10 shrink-0 rounded-2xl bg-surface-3 inline-flex items-center justify-center text-accent">
          <Swords size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] text-ink leading-snug line-clamp-2">&ldquo;{phrase.text}&rdquo;</span>
          <span className="block text-sm text-ink-3 mt-0.5">La Forja · {phrase.source}</span>
        </span>
        <ArrowRight size={16} className="text-ink-3 shrink-0" />
      </Link>

      <DailyPanel
        sleepHours={todayLog?.sleep_hours ?? null}
        mood={todayLog?.mood ?? null}
        energy={todayLog?.energy ?? null}
        waterMl={todayLog?.water_ml ?? 0}
        weightKg={todayLog?.weight_kg ?? null}
        reflection={todayLog?.reflection ?? null}
      />
    </div>
  );
}
