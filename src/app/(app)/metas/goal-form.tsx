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
import { NumberInput } from '@/components/ui/number-input';
import { fieldBase, fieldInvalid } from '@/components/ui/styles';
import { UNITS, unitFormat } from './units';

export default function GoalForm({ savings }: { savings: { id: string; name: string }[] }) {
  const [state, formAction] = useActionState(addGoal, IDLE_STATE);
  const [mode, setMode] = useState<'hitos' | 'cantidad'>('hitos');
  const [unit, setUnit] = useState('$');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode('hitos');
      setUnit('$');
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-surface border border-line rounded-3xl p-6 md:p-8 space-y-5"
    >
      <div className="flex items-center gap-2">
        <Plus size={18} className="text-amber-400" />
        <h2 className="text-lg font-semibold text-ink tracking-wide">Nueva meta</h2>
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
              <option key={c} value={c} className="bg-surface">{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Fecha límite (opcional)" error={state.fieldErrors?.target_date}>
          <Input name="target_date" type="date" invalid={!!state.fieldErrors?.target_date} />
        </Field>
        <Field label="Medir por">
          <Select value={mode} onChange={(e) => setMode(e.target.value as 'hitos' | 'cantidad')}>
            <option value="hitos" className="bg-surface">Hitos (pasos)</option>
            <option value="cantidad" className="bg-surface">Cantidad ($, km…)</option>
          </Select>
        </Field>
      </div>

      {mode === 'cantidad' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-black/20 border border-amber-500/10 rounded-2xl p-4">
          <Field label="Objetivo (cantidad)" error={state.fieldErrors?.target_value}>
            <NumberInput
              key={unit}
              name="target_value"
              {...unitFormat(unit)}
              placeholder={unit === '$' ? '500.000' : '0'}
              className={`${fieldBase} ${state.fieldErrors?.target_value ? fieldInvalid : ''}`}
            />
          </Field>
          <Field label="Unidad">
            <Select name="unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
              {UNITS.map((u) => (
                <option key={u} value={u} className="bg-surface">{u}</option>
              ))}
            </Select>
          </Field>
          <Field label="Vincular a ahorro (opcional)">
            <Select name="saving_id" defaultValue="">
              <option value="" className="bg-surface">Sin vincular</option>
              {savings.map((s) => (
                <option key={s.id} value={s.id} className="bg-surface">{s.name}</option>
              ))}
            </Select>
          </Field>
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
