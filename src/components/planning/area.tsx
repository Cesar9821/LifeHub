import type { LucideIcon } from 'lucide-react';
import { Briefcase, Dumbbell, Repeat, User, Users, Wallet, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AREA_DOT, AREA_LABEL, type Area } from '@/lib/planning/areas';

export const AREA_ICON: Record<Area, LucideIcon> = {
  trabajo: Briefcase,
  familia: Users,
  salud: Dumbbell,
  habitos: Repeat,
  finanzas: Wallet,
  proyectos: Zap,
  personal: User,
};

/** Punto de color del área (con nombre accesible). */
export function AreaDot({ area, className }: { area: Area | null; className?: string }) {
  if (!area) return <span aria-hidden className={cn('h-2 w-2 rounded-full bg-ink-3/50 shrink-0', className)} />;
  return (
    <span
      role="img"
      aria-label={AREA_LABEL[area]}
      title={AREA_LABEL[area]}
      className={cn('h-2 w-2 rounded-full shrink-0', AREA_DOT[area], className)}
    />
  );
}
