import React from 'react';

/** Contenedor de campo: etiqueta + control + ayuda/error. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className || ''}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-xs font-medium text-ink-2 px-1"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger px-1">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-3 px-1">{hint}</p>
      ) : null}
    </div>
  );
}
