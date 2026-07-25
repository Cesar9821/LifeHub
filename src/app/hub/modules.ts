import type { LucideIcon } from 'lucide-react';
import {
  Wallet,
  Brain,
  Users,
  HeartPulse,
  Target,
  Home,
} from 'lucide-react';

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

export const MODULES: AppModule[] = [
  {
    id: 'finanzas',
    name: 'Finanzas',
    tagline: 'Dinero bajo control',
    description: 'Transacciones, gastos fijos, ahorros, créditos y rendimiento.',
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
    id: 'mindset',
    name: 'Mindset',
    tagline: 'Hábitos y rutina',
    description: 'Hábitos diarios, rutina, alimentación y enfoque personal.',
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
    description: 'Tareas del hogar, calendario compartido y eventos.',
    href: '#',
    icon: Users,
    status: 'soon',
    accent: {
      text: 'text-coral-400',
      glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(244,114,94,0.4)]',
      border: 'group-hover:border-orange-500/40',
    },
  },
  {
    id: 'salud',
    name: 'Salud',
    tagline: 'Bienestar diario',
    description: 'Sueño, ánimo, energía y seguimiento de bienestar.',
    href: '#',
    icon: HeartPulse,
    status: 'soon',
    accent: {
      text: 'text-pink-400',
      glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(236,72,153,0.4)]',
      border: 'group-hover:border-pink-500/40',
    },
  },
  {
    id: 'metas',
    name: 'Metas',
    tagline: 'Objetivos y proyectos',
    description: 'Objetivos anuales, proyectos personales y seguimiento.',
    href: '#',
    icon: Target,
    status: 'soon',
    accent: {
      text: 'text-amber-400',
      glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(245,158,11,0.4)]',
      border: 'group-hover:border-amber-500/40',
    },
  },
  {
    id: 'hogar',
    name: 'Hogar',
    tagline: 'Compras y despensa',
    description: 'Lista de compras, inventario y mantención de la casa.',
    href: '#',
    icon: Home,
    status: 'soon',
    accent: {
      text: 'text-teal-400',
      glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(20,184,166,0.4)]',
      border: 'group-hover:border-teal-500/40',
    },
  },
];
