import { CalendarDays, Repeat, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AREA_BORDER } from '@/lib/planning/areas';
import { durationLabel, timeToMin } from '@/lib/planning/dates';
import type { AgendaItem } from '@/services/planning';
import { AgendaItemButton } from './agenda-item-sheet';

function sourceLabel(i: AgendaItem): string {
  if (i.source === 'routine') return 'Rutina';
  if (i.source === 'family') return 'Hogar';
  if (i.source === 'event') return 'Evento';
  if (i.source === 'task') return 'Tarea';
  return 'Bloque';
}

function SourceIcon({ item }: { item: AgendaItem }) {
  if (item.source === 'routine') return <Repeat size={13} aria-hidden />;
  if (item.source === 'family') return <Users size={13} aria-hidden />;
  if (item.source === 'event') return <CalendarDays size={13} aria-hidden />;
  return null;
}

/**
 * Agenda de un día: lo que ocupa tiempo, en orden. Los ítems sin hora van
 * arriba ("Todo el día"). `now` (HH:MM) resalta lo que está pasando.
 */
export function AgendaList({ items, now, compact = false }: { items: AgendaItem[]; now?: string | null; compact?: boolean }) {
  const allDay = items.filter((i) => !i.start);
  const timed = items.filter((i) => i.start);
  const nowMin = now ? timeToMin(now) : null;

  if (compact) {
    // Grilla semanal de escritorio: hora arriba, título abajo (columnas angostas).
    return (
      <ol className="space-y-1">
        {[...allDay, ...timed].map((i) => (
          <li key={i.key}>
            <AgendaItemButton item={i}>
              <div
                className={cn(
                  'rounded-xl bg-surface-2 border-l-[3px] px-2 py-1.5 hover:bg-surface-3',
                  i.area ? AREA_BORDER[i.area] : 'border-l-line-strong'
                )}
              >
                <span className="block text-xs text-ink-3 tabular-nums">
                  {i.start ? `${i.start}${i.end ? `–${i.end}` : ''}` : 'Todo el día'}
                </span>
                <span className={cn('block text-sm font-medium leading-snug line-clamp-2', i.done ? 'text-ink-3 line-through' : 'text-ink')}>
                  {i.title}
                </span>
              </div>
            </AgendaItemButton>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className={cn('space-y-1.5', compact && 'space-y-1')}>
      {allDay.map((i) => (
        <li key={i.key}>
          <AgendaItemButton item={i}>
            <div className={cn('flex items-center gap-3 rounded-2xl bg-surface-2 border-l-[3px] px-3', compact ? 'min-h-11 py-1.5' : 'min-h-12 py-2', i.area ? AREA_BORDER[i.area] : 'border-l-line-strong')}>
              <span className="w-14 shrink-0 text-xs font-medium text-ink-3">Todo el día</span>
              <span className="flex-1 min-w-0 text-[15px] font-medium text-ink truncate">{i.title}</span>
              <span className="text-ink-3"><SourceIcon item={i} /></span>
            </div>
          </AgendaItemButton>
        </li>
      ))}
      {timed.map((i) => {
        const s = timeToMin(i.start!);
        const e = i.end ? timeToMin(i.end) : s;
        const current = nowMin !== null && nowMin >= s && nowMin < Math.max(e, s + 1);
        const past = nowMin !== null && !current && e <= nowMin && i.end !== null;
        return (
          <li key={i.key}>
            <AgendaItemButton item={i}>
              <div
                className={cn(
                  'flex items-center gap-3 rounded-2xl border-l-[3px] px-3 transition-colors',
                  compact ? 'min-h-11 py-1.5' : 'min-h-14 py-2',
                  current ? 'bg-surface-3 ring-1 ring-accent/40' : 'bg-surface-2',
                  i.area ? AREA_BORDER[i.area] : 'border-l-line-strong',
                  past && 'opacity-60'
                )}
              >
                <span className="w-14 shrink-0 tabular-nums">
                  <span className="block text-[15px] font-semibold text-ink leading-tight">{i.start}</span>
                  {i.end && !compact && <span className="block text-xs text-ink-3">{i.end}</span>}
                </span>
                <span className="flex-1 min-w-0">
                  <span className={cn('block text-[15px] font-medium truncate', i.done ? 'text-ink-3 line-through' : 'text-ink')}>
                    {i.title}
                  </span>
                  {!compact && (
                    <span className="flex items-center gap-1.5 text-xs text-ink-3">
                      <SourceIcon item={i} />
                      {sourceLabel(i)}
                      {i.end && ` · ${durationLabel(e - s)}`}
                    </span>
                  )}
                </span>
                {current && (
                  <span className="shrink-0 rounded-full bg-accent/15 text-accent text-xs font-semibold px-2 py-0.5">Ahora</span>
                )}
              </div>
            </AgendaItemButton>
          </li>
        );
      })}
    </ol>
  );
}
