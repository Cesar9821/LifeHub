import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardBase } from './styles';

/** Tarjeta base del sistema. `as="section"` para bloques con título. */
export function Card({
  className,
  as: Tag = 'div',
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: 'div' | 'section' | 'article' }) {
  return <Tag className={cn(cardBase, 'p-5', className)} {...props} />;
}

/** Título de sección con acción opcional a la derecha ("Ver todo"). */
export function SectionHeader({
  title,
  icon,
  href,
  action,
  className,
}: {
  title: string;
  icon?: React.ReactNode;
  href?: string;
  action?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 min-h-11', className)}>
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        {icon && <span className="text-ink-3">{icon}</span>}
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-0.5 min-h-11 px-1 text-sm font-medium text-accent hover:text-ink"
        >
          {action ?? 'Ver todo'} <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}

/** Encabezado de página: título grande y subtítulo opcional. */
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 pt-2">
      <div className="min-w-0 flex-1 basis-44 space-y-1">
        {eyebrow && <p className="text-sm font-medium text-ink-3">{eyebrow}</p>}
        <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="text-[15px] text-ink-2">{subtitle}</p>}
      </div>
      {children && <div className="shrink-0 flex items-center gap-2">{children}</div>}
    </header>
  );
}
