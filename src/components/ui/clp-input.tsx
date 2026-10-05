'use client';

import { NumberInput } from './number-input';

/**
 * Input de monto en pesos con formato en vivo: al escribir 100000 muestra
 * "$ 100.000". Envía el valor numérico limpio en el campo `name`.
 */
export function CLPInput({
  name,
  defaultValue = '',
  placeholder = '0',
  required = false,
  autoFocus = false,
  className = '',
  accent = 'indigo',
  decimals = 0,
  onValueChange,
  id,
}: {
  name: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  className?: string;
  accent?: 'indigo' | 'emerald' | 'amber';
  /** Solo para montos con centavos, como una cuota de 47.498,33. */
  decimals?: number;
  onValueChange?: (value: string) => void;
  id?: string;
}) {
  return (
    <NumberInput
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      required={required}
      autoFocus={autoFocus}
      className={className || undefined}
      accent={accent}
      decimals={decimals}
      prefix="$"
      onValueChange={onValueChange}
      id={id}
    />
  );
}
