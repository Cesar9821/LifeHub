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
        'flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold border',
        ok
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      )}
    >
      {ok ? <CheckCircle2 size={14} className="shrink-0" /> : <AlertCircle size={14} className="shrink-0" />}
      {state.message}
    </div>
  );
}
