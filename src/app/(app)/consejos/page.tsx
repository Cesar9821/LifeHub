import Link from 'next/link';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIPS, TIP_CATEGORIES, TIP_CATEGORY_EMOJI, TIP_CATEGORY_LABEL, type TipCategory } from '@/lib/tips';
import { loadWellbeingToday, WELLBEING_SQL_MISSING } from '@/services/wellbeing';
import { PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FavoriteTipButton } from '@/components/wellbeing/tip-card';

export const dynamic = 'force-dynamic';

/** Todos los consejos por tema, y los que guardaste. */
export default async function ConsejosPage({ searchParams }: { searchParams: Promise<{ tema?: string }> }) {
  const { tema } = await searchParams;
  const w = await loadWellbeingToday();
  const favSet = new Set(w.favorites);
  const showFavs = tema === 'favoritos';
  const category = (TIP_CATEGORIES as readonly string[]).includes(tema ?? '') ? (tema as TipCategory) : null;
  const list = showFavs ? TIPS.filter((t) => favSet.has(t.id)) : category ? TIPS.filter((t) => t.category === category) : TIPS;

  const chips = [
    { value: '', label: 'Todos' },
    { value: 'favoritos', label: `♥ Favoritos${w.favorites.length ? ` ${w.favorites.length}` : ''}` },
    ...TIP_CATEGORIES.map((c) => ({ value: c, label: `${TIP_CATEGORY_EMOJI[c]} ${TIP_CATEGORY_LABEL[c]}` })),
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PageHeader title="Consejos" subtitle="Ideas cortas para hacer hoy. Guarda las que te sirvan." />
      {!w.ready && <p className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm text-ink-2">{WELLBEING_SQL_MISSING}</p>}

      <nav aria-label="Temas" className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar">
        <ul className="flex gap-1.5 w-max">
          {chips.map((c) => {
            const active = (tema ?? '') === c.value || (!tema && c.value === '');
            return (
              <li key={c.value || 'todos'}>
                <Link
                  href={c.value ? `/consejos?tema=${c.value}` : '/consejos'}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center min-h-11 px-4 rounded-full text-sm font-medium whitespace-nowrap border',
                    active ? 'bg-ink text-bg border-ink' : 'bg-surface border-line text-ink-2 hover:text-ink'
                  )}
                >
                  {c.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {list.length === 0 ? (
        <EmptyState
          icon={<Heart size={28} />}
          title="Aún no guardas consejos"
          text="Toca el corazón en el consejo del día (en Hoy) o en cualquiera de esta lista."
        />
      ) : (
        <ul className="bg-surface border border-line rounded-3xl divide-y divide-line">
          {list.map((t) => (
            <li key={t.id} className="flex items-start gap-3 px-4 py-3">
              <span className="text-xl leading-none pt-1" aria-hidden>
                {TIP_CATEGORY_EMOJI[t.category]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] leading-snug text-ink">{t.text}</p>
                <p className="mt-0.5 text-xs text-ink-3">
                  {TIP_CATEGORY_LABEL[t.category]}
                  {t.source && ` · ${t.source}`}
                </p>
              </div>
              <FavoriteTipButton tipId={t.id} initial={favSet.has(t.id)} disabled={!w.ready} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
