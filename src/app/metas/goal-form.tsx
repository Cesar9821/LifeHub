'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { addGoal } from './actions';
import { IDLE_STATE } from '@/lib/action';
import { GOAL_CATEGORIES } from '@/lib/constants';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { InlineMessage } from '@/components/ui/inline-message';

const UNITS = ['$', 'km', 'kg', 'libros', 'días', 'veces', 'horas'];

export default function GoalForm() {
  const [state, formAction] = useActionState(addGoal, IDLE_STATE);
  const [mode, setMode] = useState<'hitos' | 'cantidad'>('hitos');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode('hitos');
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl space-y-5"
    >
      <div className="flex items-center gap-2">
        <Plus size={18} className="text-amber-400" />
        <h2 className="text-lg font-black text-white uppercase tracking-wider">Nueva meta</h2>
      </div>

      <InlineMessage state={state} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Objetivo" error={state.fieldErrors?.title} className="md:col-span-2">
          <Input
            name="title"
            required
            defaultValue={state.values?.title ?? ''}
            placeholder="Ej: Correr una maratón, Ahorrar para un viaje…"
            invalid={!!state.fieldErrors?.title}
          />
        </Field>
        <Field label="¿Por qué importa? (tu motivo)" className="md:col-span-2">
          <Input name="motive" defaultValue={state.values?.motive ?? ''} placeholder="La razón que te va a sostener cuando cueste…" />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Categoría">
          <Select name="category" defaultValue="Personal">
            {GOAL_CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[#0A0C10]">{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Fecha límite (opcional)" error={state.fieldErrors?.target_date}>
          <Input name="target_date" type="date" invalid={!!state.fieldErrors?.target_date} />
        </Field>
        <Field label="Medir por">
          <Select value={mode} onChange={(e) => setMode(e.target.value as 'hitos' | 'cantidad')}>
            <option value="hitos" className="bg-[#0A0C10]">Hitos (pasos)</option>
            <option value="cantidad" className="bg-[#0A0C10]">Cantidad ($, km…)</option>
          </Select>
        </Field>
      </div>

      {mode === 'cantidad' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-black/20 border border-amber-500/10 rounded-2xl p-4">
          <Field label="Objetivo (cantidad)" error={state.fieldErrors?.target_value}>
            <Input
              name="target_value"
              type="number"
              min="1"
              step="any"
              placeholder="500000"
              invalid={!!state.fieldErrors?.target_value}
            />
          </Field>
          <Field label="Unidad">
            <Select name="unit" defaultValue="$">
              {UNITS.map((u) => (
                <option key={u} value={u} className="bg-[#0A0C10]">{u}</option>
              ))}
            </Select>
          </Field>
          <p className="text-[11px] text-slate-500 pb-3">
            Registrarás tu avance (ej: +$50.000) y la barra se llena sola.
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <SubmitButton pendingText="Creando…">
          <Plus size={15} /> Crear meta
        </SubmitButton>
      </div>
    </form>
  );
}
