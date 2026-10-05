'use client';

import { useState, useTransition } from 'react';
import { Droplet, Minus, Moon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { changeWater, saveSleep } from '@/app/(app)/bienestar/actions';
import { IDLE_STATE } from '@/lib/action';
import { SLEEP_GOAL, WATER_GOAL, sleepMessage } from '@/lib/wellbeing';
import { toast } from '@/components/ui/toast';

const SLEEP_OPTIONS = [5, 6, 7, 8, 9];

/** Agua (vasos de 250 ml) y sueño de anoche, en dos toques. */
export function WellbeingCard({
  water,
  sleep,
  weekWater,
  weekSleep,
}: {
  water: number;
  sleep: number | null;
  weekWater: number | null;
  weekSleep: number | null;
}) {
  const [glasses, setGlasses] = useState(water);
  const [hours, setHours] = useState<number | null>(sleep);
  const [editingSleep, setEditingSleep] = useState(false);
  const [, start] = useTransition();

  const water$ = (delta: 1 | -1) => {
    if (delta === -1 && glasses <= 0) return;
    setGlasses((g) => Math.max(0, g + delta));
    start(async () => {
      const fd = new FormData();
      fd.set('delta', String(delta));
      await changeWater(fd);
    });
  };

  const sleep$ = (h: number) => {
    const before = hours;
    setHours(h);
    setEditingSleep(false);
    start(async () => {
      const fd = new FormData();
      fd.set('hours', String(h));
      const r = await saveSleep(IDLE_STATE, fd);
      if (!r.ok) {
        setHours(before);
        toast(r.message ?? 'No se pudo guardar.');
      }
    });
  };

  const pct = Math.min(100, Math.round((glasses / WATER_GOAL) * 100));
  const msg = sleepMessage(hours);

  return (
    <section aria-label="Agua y sueño" className="space-y-4">
      {/* AGUA */}
      <div>
        <div className="flex items-center gap-3">
          <Droplet size={18} className="text-info shrink-0" />
          <p className="flex-1 min-w-0 text-[15px] text-ink">
            <span className="font-semibold tabular-nums">{glasses}</span>
            <span className="text-ink-3"> / {WATER_GOAL} vasos de agua</span>
          </p>
          <button
            type="button"
            onClick={() => water$(-1)}
            disabled={glasses <= 0}
            aria-label="Quitar un vaso de agua"
            className="h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-full border border-line-strong text-ink-2 hover:text-ink disabled:opacity-40"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            onClick={() => water$(1)}
            aria-label="Sumar un vaso de agua"
            className="h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-full bg-info/15 text-info hover:bg-info/25"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="mt-2 h-2 rounded-full bg-surface-3 overflow-hidden" aria-hidden>
          <div className="h-full rounded-full bg-info transition-[width]" style={{ width: `${pct}%` }} />
        </div>
        {weekWater != null && <p className="mt-1 text-xs text-ink-3 tabular-nums">Promedio de la semana: {weekWater} vasos</p>}
      </div>

      {/* SUEÑO */}
      <div>
        <div className="flex items-center gap-3">
          <Moon size={18} className="text-accent shrink-0" />
          <p className="flex-1 min-w-0 text-[15px] text-ink">
            {hours != null ? (
              <>
                Dormiste <span className="font-semibold tabular-nums">{hours} h</span>
                <span className="text-ink-3"> (meta {SLEEP_GOAL} h)</span>
              </>
            ) : (
              '¿Cuánto dormiste anoche?'
            )}
          </p>
          {hours != null && !editingSleep && (
            <button type="button" onClick={() => setEditingSleep(true)} className="min-h-11 px-2 text-sm font-medium text-ink-2 hover:text-ink">
              Cambiar
            </button>
          )}
        </div>
        {(hours == null || editingSleep) && (
          <div role="group" aria-label="Horas dormidas" className="mt-2 flex flex-wrap gap-2">
            {SLEEP_OPTIONS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => sleep$(h)}
                aria-pressed={hours === h}
                className={cn(
                  'min-h-11 min-w-12 px-3 rounded-full border text-sm font-medium tabular-nums',
                  hours === h ? 'bg-ink text-bg border-ink' : 'bg-surface border-line-strong text-ink-2 hover:text-ink'
                )}
              >
                {h === 5 ? '5 o menos' : h === 9 ? '9 o más' : `${h} h`}
              </button>
            ))}
          </div>
        )}
        {msg && !editingSleep && <p className="mt-1 text-sm text-ink-2">{msg}</p>}
        {weekSleep != null && <p className="mt-1 text-xs text-ink-3 tabular-nums">Promedio de la semana: {weekSleep} h</p>}
      </div>
    </section>
  );
}
