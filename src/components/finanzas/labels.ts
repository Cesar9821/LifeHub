const METHOD_LABEL: Record<string, string> = {
  debito: 'Débito',
  credito_cmr: 'CMR',
  otra_tarjeta: 'Otra tarjeta',
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
};

export function methodLabel(method: string | null): string {
  return method ? METHOD_LABEL[method] ?? method : '';
}
