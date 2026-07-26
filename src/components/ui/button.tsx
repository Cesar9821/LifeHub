import React from 'react';
import { cn } from '@/lib/utils';
import { buttonBase } from './styles';

export type ButtonVariant = 'primary' | 'ghost' | 'danger';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-white text-black hover:bg-slate-200',
  ghost: 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10',
  danger: 'bg-rose-600 text-white hover:bg-rose-500',
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return <button className={cn(buttonBase, VARIANTS[variant], className)} {...props} />;
}
