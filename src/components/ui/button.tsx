import React from 'react';
import { cn } from '@/lib/utils';
import { buttonBase, buttonPrimary } from './styles';

export type ButtonVariant = 'primary' | 'ghost' | 'danger';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: buttonPrimary,
  ghost: 'bg-surface-2 border border-line-strong text-ink hover:bg-surface-3',
  danger: 'bg-danger/15 border border-danger/30 text-danger hover:bg-danger/25',
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return <button className={cn(buttonBase, VARIANTS[variant], className)} {...props} />;
}
