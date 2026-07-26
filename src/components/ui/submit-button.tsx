'use client';

import React from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonBase } from './styles';

type SubmitButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingText?: string;
};

/**
 * Botón de submit que muestra spinner y se deshabilita mientras la acción
 * está en curso (useFormStatus). Se usa dentro de un <form>.
 */
export function SubmitButton({
  children,
  className,
  pendingText,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={cn(buttonBase, 'bg-white text-black hover:bg-slate-200', className)}
      {...props}
    >
      {pending && <Loader2 size={15} className="animate-spin" />}
      {pending ? pendingText ?? children : children}
    </button>
  );
}
