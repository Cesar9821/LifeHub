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
          className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[11px] font-bold text-rose-400 px-1">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-slate-600 px-1">{hint}</p>
      ) : null}
    </div>
  );
}
