import Link from 'next/link';
import { Target } from 'lucide-react';
import { getGoals } from '@/services/metas';
import { loadVision, WELLBEING_SQL_MISSING } from '@/services/wellbeing';
import { PageHeader } from '@/components/ui/card';
import { VisionBoard } from '@/components/wellbeing/vision-board';

export const dynamic = 'force-dynamic';

/** Tablero de visión: lo que quieres lograr, en imágenes. */
export default async function VisionPage() {
  const [vision, goals] = await Promise.all([loadVision(), getGoals().catch(() => [])]);
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader title="Tablero de visión" subtitle="Lo que quieres lograr, a la vista. Cada día verás una imagen en Hoy.">
        <Link
          href="/metas"
          className="inline-flex items-center gap-1.5 min-h-11 px-3 rounded-xl border border-line-strong text-sm font-medium text-ink-2 hover:text-ink"
        >
          <Target size={16} /> Objetivos
        </Link>
      </PageHeader>
      {vision.ready ? (
        <VisionBoard items={vision.items} goals={goals.map((g) => ({ id: g.id, title: g.title }))} />
      ) : (
        <p className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm text-ink-2">{WELLBEING_SQL_MISSING}</p>
      )}
    </div>
  );
}
