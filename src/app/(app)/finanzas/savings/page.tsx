import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/card';
import { PiggyBank, Plus, Trash2 } from 'lucide-react';
import { formatCLP } from '@/lib/format';
import { ConfirmAction } from '@/components/ui/confirm-action';
import SavingForm from './saving-form';
import { deleteSavingForm } from './actions';
import SavingDeposit from './saving-deposit';

export default async function SavingsPage() {
  const supabase = await createClient();

  const { data: savings } = await supabase
    .from('savings')
    .select('*')
    .order('created_at', { ascending: false });

  const totalSavings = savings?.reduce((acc, curr) => acc + Number(curr.current_amount), 0) || 0;
  const totalTarget = savings?.reduce((acc, curr) => acc + Number(curr.target_amount), 0) || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Ahorros" subtitle="Tus fondos: emergencia, vacaciones y otros" />

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-line rounded-2xl p-4">
          <p className="text-sm text-ink-3">Ahorrado</p>
          <p className="text-xl font-semibold tabular-nums text-success">{formatCLP(totalSavings)}</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-4">
          <p className="text-sm text-ink-3">Meta total</p>
          <p className="text-xl font-semibold tabular-nums text-ink">{formatCLP(totalTarget)}</p>
        </div>
      </div>

      <details className="bg-surface border border-line rounded-3xl" open={!savings || savings.length === 0}>
        <summary className="cursor-pointer list-none min-h-12 px-5 flex items-center gap-2 text-[15px] font-medium text-ink">
          <Plus size={16} /> Nuevo ahorro
        </summary>
        <div className="px-5 pb-5">
          <SavingForm />
        </div>
      </details>

      {savings && savings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savings.map((item) => {
            const current = Number(item.current_amount) || 0;
            const target = Number(item.target_amount) || 0;
            const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
            const remaining = Math.max(0, target - current);
            return (
              <article key={item.id} className="bg-surface border border-line rounded-3xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 text-[17px] font-semibold text-ink break-words">{item.name}</h3>
                  <ConfirmAction
                    action={deleteSavingForm}
                    fields={{ id: item.id }}
                    title={`¿Eliminar "${item.name}"?`}
                    message="Se borra este ahorro. Los abonos ya registrados como movimientos se conservan."
                    confirmLabel="Eliminar"
                    triggerTitle="Eliminar ahorro"
                    triggerClassName="h-11 w-11 -mr-2 -mt-2 shrink-0 inline-flex items-center justify-center rounded-xl text-ink-3 hover:text-danger hover:bg-danger/10"
                  >
                    <Trash2 size={16} />
                    <span className="sr-only">Eliminar {item.name}</span>
                  </ConfirmAction>
                </div>
                <div>
                  <p className="text-[28px] leading-tight font-semibold tabular-nums text-ink">{formatCLP(current)}</p>
                  <p className="text-sm text-ink-3">
                    {target > 0 ? `de ${formatCLP(target)} · faltan ${formatCLP(remaining)}` : 'Sin meta definida'}
                  </p>
                </div>
                {target > 0 && (
                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-surface-3 overflow-hidden" aria-hidden>
                      <div className="h-full rounded-full bg-success" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-ink-3 tabular-nums">{Math.round(progress)}% de la meta</p>
                  </div>
                )}
                <div className="pt-3 border-t border-line">
                  <SavingDeposit id={item.id} />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center gap-2 rounded-3xl border border-dashed border-line-strong px-6 py-8">
          <PiggyBank size={28} className="text-ink-3" />
          <p className="text-[15px] font-semibold text-ink">Aún no tienes ahorros</p>
          <p className="text-sm text-ink-2 max-w-xs">Parte con un fondo de emergencia. Cada abono queda registrado en tus movimientos.</p>
        </div>
      )}
    </div>
  );
}
