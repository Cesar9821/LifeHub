import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Estado vacío amable y breve. Nunca dejar una pantalla en blanco. */
export function EmptyState({
  icon,
  title,
  text,
  href,
  action,
  className,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  text?: string;
  href?: string;
  action?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center gap-2 rounded-3xl border border-dashed border-line-strong px-6 py-8',
        className
      )}
    >
      {icon && <div className="mb-1 text-ink-3">{icon}</div>}
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {text && <p className="text-sm text-ink-2 max-w-xs">{text}</p>}
      {href && action && (
        <Link
          href={href}
          className="mt-2 inline-flex items-center min-h-11 px-4 rounded-xl bg-surface-3 border border-line-strong text-sm font-semibold text-ink hover:bg-surface-2"
        >
          {action}
        </Link>
      )}
      {children}
    </div>
  );
}
