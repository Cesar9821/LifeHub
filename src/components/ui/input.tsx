import React from 'react';
import { cn } from '@/lib/utils';
import { fieldBase, fieldInvalid } from './styles';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export function Input({ className, invalid, ...props }: InputProps) {
  return <input className={cn(fieldBase, invalid && fieldInvalid, className)} {...props} />;
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export function Textarea({ className, invalid, ...props }: TextareaProps) {
  return (
    <textarea className={cn(fieldBase, 'resize-none', invalid && fieldInvalid, className)} {...props} />
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export function Select({ className, invalid, children, ...props }: SelectProps) {
  return (
    <select className={cn(fieldBase, 'appearance-none pr-8', invalid && fieldInvalid, className)} {...props}>
      {children}
    </select>
  );
}
