'use client';

import { useMemo, useState } from 'react';
import { CircleCheck, CircleAlert, CircleX } from 'lucide-react';
import { formatCLP } from '@/lib/format';
import { cn } from '@/lib/utils';
import { canAfford, type AffordLevel, type MonthMoney, type PotLine } from '@/lib/plan/afford';
import { parseSubmitted } from '@/lib/number-input';
import { CLPInput } from '@/components/ui/clp-input';
import { Select } from '@/components/ui/input';

const LEVEL: Record<AffordLevel, { title: string; tone: string; icon: typeof CircleCheck }> = {
  si: { title: 'Puedes hacerlo', tone: 'border-success/30 bg-success/5 text-success', icon: CircleCheck },
  ojo: { title: 'Puedes, pero reduce tu margen', tone: 'border-warning/30 bg-warning/5 text-warning', icon: CircleAlert },
  no: { title: 'No recomendado este mes', tone: 'border-danger/30 bg-danger/5 text-danger', icon: CircleX },
};

/**
 * "¿Puedo gastar esto?": recomendación con los datos del plan (disponible,
 * cuentas por pagar, gastos variables por venir y un colchón del 10%).
 * No es una decisión absoluta: explica el cálculo en palabras simples.
 */
export function AffordCheck({ money, pots }: { money: MonthMoney; pots: PotLine[] }) {
  const [raw, setRaw] = useState('');
  const [potId, setPotId] = useState('');
  const amount = parseSubmitted(raw) ?? 0;
  const pot = pots.find((p) => p.conceptId === potId);
  const potLeft = pot ? Math.max(0, pot.budget - pot.spent) : 0;
  const result = useMemo(() => (amount > 0 ? canAfford(money, amount, potLeft) : null), [money, amount, potLeft]);
  const L = result ? LEVEL[result.level] : null;

  return (
    <section id="puedo-gastar" aria-labelledby="puedo-gastar-title" className="bg-surface border border-line rounded-3xl p-5 space-y-4 scroll-mt-24">
      <div>
        <h2 id="puedo-gastar-title" className="text-[16px] font-semibold text-ink">
          ¿Puedo gastar esto?
        </h2>
        <p className="text-sm text-ink-3">Una recomendación con tus números del mes, no una regla.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="afford-amount" className="text-xs font-medium text-ink-2 px-1">
            Monto
          </label>
          <CLPInput id="afford-amount" name="afford_amount" placeholder="80.000" onValueChange={setRaw} />
        </div>
        {pots.length > 0 && (
          <div className="space-y-1.5">
            <label htmlFor="afford-pot" className="text-xs font-medium text-ink-2 px-1">
              ¿De qué es? (opcional)
            </label>
            <Select id="afford-pot" value={potId} onChange={(e) => setPotId(e.target.value)}>
              <option value="">Otro / no sé</option>
              {pots.map((p) => (
                <option key={p.conceptId} value={p.conceptId}>
                  {p.name} · quedan {formatCLP(Math.max(0, p.budget - p.spent))}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {result && L && (
        <div role="status" className={cn('rounded-2xl border p-4 space-y-2', L.tone)}>
          <p className="flex items-center gap-2 text-[16px] font-semibold">
            <L.icon size={20} /> {L.title}
          </p>
          <p className="text-[15px] text-ink">
            Después de este gasto te quedarían aproximadamente{' '}
            <strong className="tabular-nums">{formatCLP(result.availableAfter)}</strong> disponibles para el resto del mes.
          </p>
          <p className="text-sm text-ink-2">
            {result.coveredByPot > 0 && pot && `${formatCLP(result.coveredByPot)} cabe en lo que queda de ${pot.name}. `}
            Descontando cuentas por pagar ({formatCLP(money.committed)}) y gastos variables por venir (
            {formatCLP(money.variableLeft)}), tu margen libre sería{' '}
            <span className={cn('tabular-nums', result.marginAfter < 0 ? 'text-danger' : 'text-ink')}>{formatCLP(result.marginAfter)}</span>
            {result.cushion > 0 && ` (colchón sugerido: ${formatCLP(result.cushion)})`}.
          </p>
        </div>
      )}
    </section>
  );
}
