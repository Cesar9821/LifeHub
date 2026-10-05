import { Quote } from 'lucide-react';
import { blockFor, getToday369 } from '@/services/manifest369';
import { phraseOfDay } from '@/lib/mindset-phrases';
import { nowTimeChile } from '@/lib/planning/dates';
import { PageHeader } from '@/components/ui/card';
import Manifest369 from './manifest-369';

export const dynamic = 'force-dynamic';

export default async function ForjaPage() {
  const state = await getToday369();
  const phrase = phraseOfDay();

  return (
    <div className="space-y-5">
      <PageHeader title="La Forja" subtitle="Una idea para el día y tu meta grabada con el método 369." />

      {/* FRASE DEL DÍA */}
      <div className="relative bg-surface border border-line rounded-3xl p-5 md:p-7 overflow-hidden">
        <Quote size={72} aria-hidden className="absolute -right-3 -top-3 text-accent/10" />
        <p className="relative text-lg md:text-2xl font-semibold text-ink leading-snug tracking-tight">
          &ldquo;{phrase.text}&rdquo;
        </p>
        <p className="relative mt-3 text-sm font-medium text-accent">{phrase.source}</p>
      </div>

      {/* MÉTODO 369 */}
      <Manifest369 state={state} block={blockFor(nowTimeChile())} />
    </div>
  );
}
