import { redirect } from 'next/navigation';

// URL de entrada limpia del módulo Finanzas.
// Guarda /finanzas como acceso directo; abre en el dashboard.
export default function FinanzasIndex() {
  redirect('/finanzas/dashboard');
}
