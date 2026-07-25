import type { LucideIcon } from 'lucide-react';
import { Wallet, Brain, Users, Target } from 'lucide-react';

export type ModuleStatus = 'active' | 'soon';

export interface AppModule {
  id: string;
  name: string;
  tagline: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status: ModuleStatus;
  /** Clases Tailwind para el acento de color de la tarjeta */
  accent: {
    text: string;
    glow: string;
    border: string;
  };
}

/**
 * LifeHub — 4 pilares de vida.
 * Salud vive dentro de Mentalidad (ánimo/sueño/energía) y Hogar dentro de
 * Familia (compras/despensa), por eso no aparecen como módulos aparte.
 */
export const MODULES: AppModule[] = [
  {
    id: 'finanzas',
    name: 'Finanzas',
    tagline: 'Dinero bajo control',
    description: 'Movimientos, planificación mensual, ahorros y créditos.',
    href: '/finanzas/dashboard',
    icon: Wallet,
    status: 'active',
    accent: {
      text: 'text-emerald-400',
      glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]',
      border: 'group-hover:border-emerald-500/40',
    },
  },
  {
    id: 'mentalidad',
    name: 'Mentalidad',
    tagline: 'Hábitos y bienestar',
    description: 'Hábitos diarios, rutina, ánimo, sueño y energía.',
    href: '/mindset',
    icon: Brain,
    status: 'active',
    accent: {
      text: 'text-indigo-400',
      glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.4)]',
      border: 'group-hover:border-indigo-500/40',
    },
  },
  {
    id: 'familia',
    name: 'Familia',
    tagline: 'Organización en casa',
    description: 'Tareas del hogar, calendario compartido, compras y despensa.',
    href: '#',
    icon: Users,
    status: 'soon',
    accent: {
      text: 'text-orange-400',
      glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.4)]',
      border: 'group-hover:border-orange-500/40',
    },
  },
  {
    id: 'metas',
    name: 'Metas',
    tagline: 'Objetivos y proyectos',
    description: 'Objetivos anuales, proyectos personales y seguimiento de progreso.',
    href: '#',
    icon: Target,
    status: 'soon',
    accent: {
      text: 'text-amber-400',
      glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(245,158,11,0.4)]',
      border: 'group-hover:border-amber-500/40',
    },
  },
];
