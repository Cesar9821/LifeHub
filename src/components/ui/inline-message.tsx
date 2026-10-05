import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormState } from '@/lib/action';

/** Muestra el mensaje de éxito/error de una Server Action (contrato FormState). */
export function InlineMessage({ state }: { state: FormState | undefined }) {
  if (!state?.message) return null;
  const ok = state.ok;
  return (
    <div
      role={ok ? 'status' : 'alert'}
      className={cn(
        'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium border',
        ok ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/25'
      )}
    >
      {ok ? <CheckCircle2 size={14} className="shrink-0" /> : <AlertCircle size={14} className="shrink-0" />}
      {state.message}
    </div>
  );
}
