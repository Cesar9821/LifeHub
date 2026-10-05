'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Heart, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tipById, tipCycle, TIP_CATEGORY_EMOJI, TIP_CATEGORY_LABEL } from '@/lib/tips';
import { toggleTipFavorite } from '@/app/(app)/bienestar/actions';
import { toast } from '@/components/ui/toast';

/** Botón de favorito (optimista: cambia al tiro y se revierte si falla). */
export function FavoriteTipButton({ tipId, initial, disabled }: { tipId: string; initial: boolean; disabled?: boolean }) {
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={disabled || pending}
      aria-pressed={fav}
      aria-label={fav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      title={disabled ? 'Disponible al activar bienestar' : undefined}
      onClick={() => {
        const was = fav;
        setFav(!was);
        start(async () => {
          const fd = new FormData();
          fd.set('tip_id', tipId);
          fd.set('fav', String(was));
          const r = await toggleTipFavorite(fd);
          if (!r.ok) {
            setFav(was);
            toast(r.message ?? 'No se pudo guardar.');
          } else toast(r.message ?? 'Listo.');
        });
      }}
      className={cn(
        'h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-full transition-colors disabled:opacity-40',
        fav ? 'text-danger hover:bg-danger/10' : 'text-ink-3 hover:text-ink hover:bg-surface-2'
      )}
    >
      <Heart size={18} fill={fav ? 'currentColor' : 'none'} />
    </button>
  );
}

/**
 * Consejo del día en Hoy: elegido según cómo viene tu día. "Otro" muestra
 * más del mismo tema y luego de otros; el corazón lo guarda en favoritos.
 */
export function TipCard({
  tipId,
  reason,
  favorites,
  canSave,
}: {
  tipId: string;
  reason: string | null;
  favorites: string[];
  canSave: boolean;
}) {
  const first = tipById(tipId)!;
  const cycle = useMemo(() => tipCycle(first), [first]);
  const [i, setI] = useState(0);
  const tip = cycle[i % cycle.length];
  const favSet = useMemo(() => new Set(favorites), [favorites]);

  return (
    <section aria-labelledby="consejo-dia" className="rounded-3xl border border-accent/25 bg-gradient-to-br from-accent/10 via-surface to-surface p-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none pt-0.5" aria-hidden>
          {TIP_CATEGORY_EMOJI[tip.category]}
        </span>
        <div className="flex-1 min-w-0">
          <h2 id="consejo-dia" className="text-xs font-semibold uppercase tracking-wide text-accent">
            Consejo del día · {TIP_CATEGORY_LABEL[tip.category]}
          </h2>
          <p className="mt-1.5 text-[17px] leading-snug font-medium text-ink" aria-live="polite">
            {tip.text}
          </p>
          {tip.source && <p className="mt-1 text-sm text-ink-3">{tip.source}</p>}
          {i === 0 && reason && <p className="mt-2 text-sm text-ink-2">{reason}</p>}
        </div>
        <FavoriteTipButton key={tip.id} tipId={tip.id} initial={favSet.has(tip.id)} disabled={!canSave} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setI((n) => n + 1)}
          className="inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-xl border border-line-strong text-sm font-medium text-ink-2 hover:text-ink hover:bg-surface-2"
        >
          <RefreshCw size={15} /> Otro consejo
        </button>
        <Link href="/consejos" className="inline-flex items-center min-h-11 px-2 text-sm font-medium text-accent hover:text-ink">
          Ver todos
        </Link>
      </div>
    </section>
  );
}
