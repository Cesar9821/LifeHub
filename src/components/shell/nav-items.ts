import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Briefcase,
  CalendarDays,
  Home,
  Image,
  Inbox,
  LayoutGrid,
  Lightbulb,
  Moon,
  Repeat,
  Settings,
  Sun,
  Target,
  Timer,
  Wallet,
  Zap,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Rutas que también marcan este ítem como activo. */
  match?: string[];
}

/** Las 5 pestañas principales (barra inferior en el celular). */
export const MAIN_NAV: NavItem[] = [
  { label: 'Hoy', href: '/hoy', icon: Sun },
  { label: 'Semana', href: '/semana', icon: CalendarDays },
  { label: 'Trabajo', href: '/trabajo', icon: Briefcase },
  { label: 'Finanzas', href: '/finanzas', icon: Wallet },
  {
    label: 'Más',
    href: '/mas',
    icon: LayoutGrid,
    match: [
      '/capturas',
      '/habitos',
      '/enfoque',
      '/cierre',
      '/consejos',
      '/proyectos',
      '/familia',
      '/metas',
      '/vision',
      '/mindset',
      '/notificaciones',
    ],
  },
];

/** Lo que vive dentro de "Más" (en escritorio se ve en el menú lateral). */
export const MORE_NAV: NavItem[] = [
  { label: 'Capturas', href: '/capturas', icon: Inbox },
  { label: 'Hábitos', href: '/habitos', icon: Repeat, match: ['/mindset'] },
  { label: 'Enfoque', href: '/enfoque', icon: Timer },
  { label: 'Cierre del día', href: '/cierre', icon: Moon },
  { label: 'Consejos', href: '/consejos', icon: Lightbulb },
  { label: 'Proyectos', href: '/proyectos', icon: Zap },
  { label: 'Hogar', href: '/familia', icon: Home },
  { label: 'Objetivos', href: '/metas', icon: Target },
  { label: 'Tablero de visión', href: '/vision', icon: Image },
  { label: 'Notificaciones', href: '/notificaciones', icon: Bell },
  { label: 'Perfil y hogar', href: '/finanzas/ajustes', icon: Settings },
];

export function isActive(pathname: string, item: NavItem): boolean {
  const paths = [item.href, ...(item.match ?? [])];
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
