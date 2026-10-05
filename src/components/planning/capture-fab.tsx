'use client';

import { useActionState, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Bell, CalendarPlus, Lightbulb, ListTodo, Plus, Receipt } from 'lucide-react';
import { captureItem, getQuickExpenseData } from '@/app/(app)/tareas/actions';
import { IDLE_STATE } from '@/lib/action';
import { todayStr } from '@/lib/format';
import { nowTimeChile } from '@/lib/planning/dates';
import { ExpenseForm } from '@/components/finanzas/expense-sheet';
import type { QuickData } from '@/components/finanzas/types';
import { Sheet } from '@/components/ui/sheet';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { ChoiceChips } from './chips';

type Mode = 'menu' | 'task' | 'event' | 'gasto' | 'idea' | 'reminder';

const OPTIONS: { mode: Exclude<Mode, 'menu'>; label: string; hint: string; icon: typeof ListTodo }[] = [
  { mode: 'task', label: 'Tarea', hint: 'Algo que hacer', icon: ListTodo },
  { mode: 'gasto', label: 'Gasto', hint: 'Registrar en Finanzas', icon: Receipt },
  { mode: 'event', label: 'Evento', hint: 'Algo con día y hora', icon: CalendarPlus },
  { mode: 'idea', label: 'Idea', hint: 'Para no olvidarla', icon: Lightbulb },
  { mode: 'reminder', label: 'Recordatorio', hint: 'Te aviso a una hora', icon: Bell },
];

const TITLES: Record<Mode, string> = {
  menu: '¿Qué quieres agregar?',
  task: 'Nueva tarea',
  event: 'Nuevo evento',
  gasto: 'Registrar gasto',
  idea: 'Nueva idea',
  reminder: 'Nuevo recordatorio',
};

const AREA_OPTIONS = [
  { value: 'trabajo', label: 'Trabajo' },
  { value: 'familia', label: 'Familia' },
  { value: 'salud', label: 'Salud' },
  { value: 'personal', label: 'Personal' },
  { value: 'proyectos', label: 'Proyectos' },
] as const;

function nextHour(): string {
  const h = Number(nowTimeChile().slice(0, 2));
  return `${String(Math.min(23, h + 1)).padStart(2, '0')}:00`;
}

function CaptureForm({ mode, onDone }: { mode: Exclude<Mode, 'menu' | 'gasto'>; onDone: () => void }) {
  const [state, formAction] = useActionState(captureItem, IDLE_STATE);
  const [when, setWhen] = useState<'inbox' | 'hoy' | 'semana' | ''>('inbox');
  const [area, setArea] = useState<string>('');
  const [shared, setShared] = useState(false);
  const err = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? 'Guardado.');
      onDone();
    }
  }, [state, onDone]);

  const placeholder = {
    task: 'Ej: Comprar regalo para Sarita',
    idea: 'Ej: Ofrecer mantención anual en InnVolt',
    reminder: 'Ej: Llamar al proveedor',
    event: 'Ej: Reunión del colegio',
  }[mode];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="type" value={mode} />
      {mode === 'task' && <input type="hidden" name="when" value={when || 'inbox'} />}
      {mode !== 'idea' && <input type="hidden" name="area" value={area} />}
      {mode === 'event' && shared && <input type="hidden" name="shared" value="on" />}

      <Field label={mode === 'idea' ? '¿Qué se te ocurrió?' : '¿Qué es?'} htmlFor="capture-title" error={err.title}>
        <Input
          id="capture-title"
          name="title"
          required
          autoFocus
          autoComplete="off"
          maxLength={300}
          placeholder={placeholder}
          defaultValue={state.values?.title ?? ''}
          invalid={!!err.title}
        />
      </Field>

      {mode === 'task' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-ink-2 px-1">¿Cuándo?</p>
          <ChoiceChips
            label="Cuándo"
            value={when}
            onChange={setWhen}
            options={[
              { value: 'inbox', label: 'Después lo ordeno' },
              { value: 'hoy', label: 'Hoy' },
              { value: 'semana', label: 'Esta semana' },
            ]}
          />
        </div>
      )}

      {(mode === 'reminder' || mode === 'event') && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Día" htmlFor="capture-date" error={err.date}>
            <Input id="capture-date" type="date" name="date" required defaultValue={todayStr()} />
          </Field>
          <Field label={mode === 'event' ? 'Desde (opcional)' : 'Hora'} htmlFor="capture-time" error={err.time}>
            <Input
              id="capture-time"
              type="time"
              name="time"
              required={mode === 'reminder'}
              defaultValue={mode === 'reminder' ? nextHour() : ''}
            />
          </Field>
          {mode === 'event' && (
            <Field label="Hasta (opcional)" htmlFor="capture-end" error={err.end_time} className="col-span-2 sm:col-span-1">
              <Input id="capture-end" type="time" name="end_time" />
            </Field>
          )}
        </div>
      )}

      {mode === 'event' && (
        <label className="flex items-center justify-between gap-4 min-h-11 px-1 cursor-pointer">
          <span>
            <span className="block text-[15px] font-medium text-ink">Es familiar</span>
            <span className="block text-sm text-ink-3">Lo ve todo el hogar en su calendario</span>
          </span>
          <input
            type="checkbox"
            checked={shared}
            onChange={(e) => setShared(e.target.checked)}
            className="h-5 w-5 accent-[var(--color-accent)] shrink-0"
          />
        </label>
      )}

      {mode !== 'idea' && !(mode === 'event' && shared) && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-ink-2 px-1">Área (opcional)</p>
          <ChoiceChips label="Área" value={area} onChange={setArea} allowNone options={[...AREA_OPTIONS]} />
        </div>
      )}

      <InlineMessage state={state.ok ? undefined : state} />
      <SubmitButton pendingText="Guardando…" className="w-full min-h-12">
        {mode === 'reminder' ? 'Recordarme' : mode === 'event' ? 'Agendar' : 'Guardar'}
      </SubmitButton>
    </form>
  );
}

function GastoPanel({ onDone }: { onDone: () => void }) {
  const [data, setData] = useState<QuickData | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    getQuickExpenseData()
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(null));
    return () => {
      alive = false;
    };
  }, []);

  if (data === undefined) {
    return (
      <div className="space-y-3" role="status" aria-label="Cargando">
        <Skeleton className="h-16" />
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
      </div>
    );
  }
  if (data === null) {
    return (
      <div className="space-y-3 text-center py-4">
        <p className="text-[15px] text-ink-2">Para registrar gastos, primero carga el plan del hogar en Finanzas.</p>
        <Link href="/finanzas" onClick={onDone} className="inline-flex items-center min-h-11 px-4 rounded-xl bg-surface-3 text-sm font-semibold">
          Ir a Finanzas
        </Link>
      </div>
    );
  }
  return <ExpenseForm data={data} onDone={onDone} />;
}

/**
 * Botón "+" global: tarea, gasto, evento, idea o recordatorio en pocos toques.
 * En Finanzas abre directo el registro de gasto.
 */
export function CaptureFab() {
  const pathname = usePathname();
  const inFinanzas = pathname.startsWith('/finanzas');
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('menu');
  const [formKey, setFormKey] = useState(0);

  const openSheet = () => {
    setMode(inFinanzas ? 'gasto' : 'menu');
    setFormKey((k) => k + 1);
    setOpen(true);
  };
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-label={inFinanzas ? 'Registrar gasto' : 'Agregar'}
        className={
          'fixed z-[55] right-4 bottom-[calc(76px+env(safe-area-inset-bottom))] lg:bottom-8 lg:right-8 inline-flex items-center justify-center gap-2 h-14 rounded-full bg-ink text-bg font-semibold shadow-lg shadow-black/50 hover:bg-white active:scale-95 transition-all ' +
          (inFinanzas ? 'pl-5 pr-6' : 'w-14')
        }
      >
        <Plus size={24} strokeWidth={2.5} />
        {inFinanzas && <span>Gasto</span>}
      </button>

      <Sheet open={open} onClose={close} title={TITLES[mode]}>
        {mode !== 'menu' && !inFinanzas && (
          <button
            type="button"
            onClick={() => setMode('menu')}
            className="-mt-2 mb-3 inline-flex items-center gap-1.5 min-h-11 text-sm font-medium text-ink-2 hover:text-ink"
          >
            <ArrowLeft size={16} /> Otra cosa
          </button>
        )}
        {mode === 'menu' && (
          <ul className="grid grid-cols-2 gap-2.5">
            {OPTIONS.map((o) => {
              const Icon = o.icon;
              return (
                <li key={o.mode} className={o.mode === 'task' ? 'col-span-2' : ''}>
                  <button
                    type="button"
                    onClick={() => setMode(o.mode)}
                    className="w-full h-full min-h-[76px] flex items-center gap-3 px-4 rounded-2xl bg-surface border border-line hover:border-line-strong text-left"
                  >
                    <span className="h-10 w-10 shrink-0 rounded-xl bg-surface-3 inline-flex items-center justify-center text-accent">
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold text-ink">{o.label}</span>
                      <span className="block text-sm text-ink-3 truncate">{o.hint}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {mode === 'gasto' && <GastoPanel key={formKey} onDone={close} />}
        {mode !== 'menu' && mode !== 'gasto' && <CaptureForm key={`${mode}-${formKey}`} mode={mode} onDone={close} />}
      </Sheet>
    </>
  );
}
