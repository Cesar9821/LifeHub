'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Moon } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import type { Reflection } from '@/services/wellbeing';
import { MOODS } from '@/lib/wellbeing';
import { ClosingForm } from './closing-form';

/**
 * Cierre del día en Hoy: desde las 18:00 invita a cerrar el día; si ya se
 * cerró, muestra un resumen corto (y se puede editar).
 */
export function ClosingCard({ reflection, streak, now }: { reflection: Reflection | null; streak: number; now: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const evening = now >= '18:00';
  if (!reflection && !evening) return null;
  const mood = MOODS.find((m) => m.value === String(reflection?.mood ?? ''));

  return (
    <>
      {reflection ? (
        <section aria-label="Cierre del día" className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-4">
          <span className="h-10 w-10 shrink-0 rounded-2xl bg-surface-3 inline-flex items-center justify-center text-xl" aria-hidden>
            {mood?.label ?? '🌙'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-ink">Día cerrado</p>
            <p className="text-sm text-ink-2 truncate">
              {reflection.tomorrow_first ? `Mañana: ${reflection.tomorrow_first}` : streak > 1 ? `${streak} días seguidos cerrando el día` : 'Bien hecho.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="min-h-11 px-3 rounded-xl text-sm font-medium text-ink-2 hover:text-ink hover:bg-surface-2"
          >
            Editar
          </button>
        </section>
      ) : (
        <section aria-labelledby="cierre-titulo" className="rounded-3xl border border-info/30 bg-info/5 p-5">
          <div className="flex items-start gap-3">
            <Moon size={22} className="text-info shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h2 id="cierre-titulo" className="text-[16px] font-semibold text-ink">
                Cierra tu día
              </h2>
              <p className="text-sm text-ink-2">
                Un minuto: qué salió bien, qué agradeces y con qué partes mañana.
                {streak > 0 && ` Llevas ${streak} ${streak === 1 ? 'día' : 'días seguidos'}.`}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center min-h-11 px-4 rounded-xl bg-ink text-bg text-sm font-semibold hover:bg-white"
            >
              Cerrar el día
            </button>
            <Link href="/cierre" className="inline-flex items-center min-h-11 px-2 text-sm font-medium text-ink-2 hover:text-ink">
              Ver mis cierres
            </Link>
          </div>
        </section>
      )}
      <Sheet open={open} onClose={close} title="Cierre del día">
        <ClosingForm initial={reflection} onDone={close} />
      </Sheet>
    </>
  );
}
