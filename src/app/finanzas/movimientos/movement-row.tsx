'use client';

import { useState } from 'react';
import { Check, RotateCcw, Trash2, Clock, AlertTriangle, CalendarCheck, Pencil } from 'lucide-react';
import { confirmMovement, revertMovement, deleteMovement, editMovementAmount } from './actions';
import { CLPInput } from '@/components/ui/clp-input';

interface Props {
  id: string;
  description: string;
  kind: 'income' | 'expense';
  category: string;
  estimatedAmount: number;
  actualAmount: number | null;
  effectiveAmount: number;
  status: 'pending' | 'confirmed';
  dueDate: string;
  dateState: 'overdue' | 'today' | 'upcoming';
  isVariable: boolean;
  registeredBy?: string | null;
}

function clp(n: number) {
  return '$' + Math.round(n).toLocaleString('es-CL');
}

export default function MovementRow(p: Props) {
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [editing, setEditing] = useState(false);

  const isIncome = p.kind === 'income';
  const confirmed = p.status === 'confirmed';

  // Colores de estado por fecha (solo si está pendiente)
  const stateStyles = confirmed
    ? { dot: 'bg-slate-600', text: 'text-slate-500', border: 'border-white/5' }
    : p.dateState === 'overdue'
    ? { dot: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/20' }
    : p.dateState === 'today'
    ? { dot: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/20' }
    : { dot: 'bg-slate-500', text: 'text-slate-400', border: 'border-white/5' };

  const day = new Date(p.dueDate + 'T00:00:00').getDate();

  return (
    <div
      className={`bg-black/20 border ${stateStyles.border} rounded-2xl p-4 group ${
        confirmed ? 'opacity-70' : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Fecha + descripción */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col items-center justify-center h-11 w-11 rounded-xl bg-black/40 border border-white/10 shrink-0">
            <span className="text-sm font-black text-slate-200 leading-none">{day}</span>
            <span className="text-[7px] font-bold text-slate-500 uppercase mt-0.5">día</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-bold truncate ${confirmed ? 'text-slate-400 line-through' : 'text-white'}`}>
              {p.description}
            </p>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${stateStyles.dot}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${stateStyles.text}`}>
                {confirmed
                  ? 'Confirmado'
                  : p.dateState === 'overdue'
                  ? 'Vencido'
                  : p.dateState === 'today'
                  ? 'Vence hoy'
                  : 'Próximo'}
                {' · '}
                {p.category}
                {p.registeredBy && ` · ${p.registeredBy}`}
              </span>
            </div>
          </div>
          {/* Monto visible junto a la descripción en móvil */}
          <span
            className={`sm:hidden text-sm font-black font-mono shrink-0 ${
              isIncome ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isIncome ? '+' : '−'}
            {clp(p.effectiveAmount)}
          </span>
        </div>

        {/* Monto (escritorio) + acciones */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
          <span
            className={`hidden sm:inline text-sm font-black font-mono ${
              isIncome ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isIncome ? '+' : '−'}
            {clp(p.effectiveAmount)}
          </span>

          {confirmed ? (
            <>
              <form action={revertMovement}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  title="Revertir a pendiente"
                  className="p-2 text-slate-500 hover:text-amber-400 transition-colors"
                >
                  <RotateCcw size={15} />
                </button>
              </form>
              <form action={deleteMovement}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  title="Eliminar"
                  className="p-2 text-slate-600 hover:text-rose-400 transition-colors opacity-60 md:opacity-0 md:group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Editar monto (todos los pendientes) */}
              <button
                onClick={() => setEditing((v) => !v)}
                title="Editar monto"
                className={`p-2 transition-colors ${editing ? 'text-indigo-400' : 'text-slate-500 hover:text-indigo-400'}`}
              >
                <Pencil size={14} />
              </button>

              {/* Confirmar: si es variable, pide monto real al confirmar */}
              {p.isVariable && !showAmountInput ? (
                <button
                  onClick={() => setShowAmountInput(true)}
                  title="Confirmar con monto real"
                  className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-2 rounded-xl font-black text-xs hover:bg-emerald-500/20 transition-all active:scale-95"
                >
                  <Check size={14} /> Pagar
                </button>
              ) : !p.isVariable ? (
                <form action={confirmMovement}>
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    title="Marcar como pagado/recibido"
                    className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-2 rounded-xl font-black text-xs hover:bg-emerald-500/20 transition-all active:scale-95"
                  >
                    <Check size={14} /> {isIncome ? 'Recibí' : 'Pagué'}
                  </button>
                </form>
              ) : null}

              <form action={deleteMovement}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  title="Eliminar"
                  className="p-2 text-slate-600 hover:text-rose-400 transition-colors opacity-60 md:opacity-0 md:group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Editar monto estimado (cualquier pendiente) */}
      {editing && !confirmed && (
        <form
          action={editMovementAmount}
          className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          onSubmit={() => setEditing(false)}
        >
          <input type="hidden" name="id" value={p.id} />
          <div className="flex-1">
            <CLPInput
              name="amount"
              defaultValue={p.estimatedAmount}
              placeholder="Nuevo monto"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-black text-xs hover:bg-indigo-400 transition-all active:scale-95 shrink-0 w-full sm:w-auto"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-slate-500 hover:text-white px-2 py-2 text-xs font-bold shrink-0"
          >
            Cancelar
          </button>
        </form>
      )}

      {/* Input de monto real (al confirmar un variable) */}
      {p.isVariable && showAmountInput && !confirmed && (
        <form action={confirmMovement} className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input type="hidden" name="id" value={p.id} />
          <div className="flex-1">
            <CLPInput
              name="actual_amount"
              defaultValue={p.estimatedAmount}
              placeholder="Monto real pagado"
              autoFocus
              accent="emerald"
            />
          </div>
          <button
            type="submit"
            className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-black text-xs hover:bg-emerald-400 transition-all active:scale-95 shrink-0 w-full sm:w-auto"
          >
            Confirmar
          </button>
          <button
            type="button"
            onClick={() => setShowAmountInput(false)}
            className="text-slate-500 hover:text-white px-2 py-2 text-xs font-bold shrink-0"
          >
            Cancelar
          </button>
        </form>
      )}
    </div>
  );
}
