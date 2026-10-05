import { cn } from '@/lib/utils';

/** Bloque de carga: muestra la estructura mientras llegan los datos. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('rounded-2xl bg-surface-2 animate-pulse', className)} />;
}

/**
 * Esqueleto genérico de página: título + tarjetas.
 * Ojo: no usarlo en un `loading.tsx` de una pantalla con acciones. Con Next 16.2,
 * en producción la pantalla quedaba congelada después de marcar o agregar algo
 * (se guardaba, pero no se veía hasta recargar).
 */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-5" role="status" aria-label="Cargando">
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-56" />
      </div>
      {Array.from({ length: cards }, (_, i) => (
        <Skeleton key={i} className={i === 0 ? 'h-40' : 'h-28'} />
      ))}
    </div>
  );
}
