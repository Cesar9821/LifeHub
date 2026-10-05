'use client';

import React, { useActionState, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Repeat, Trash2 } from 'lucide-react';
import { deleteBlock, editOccurrence, removeOccurrence, updateFamilyEvent } from '@/app/(app)/semana/actions';
import { toggleTaskDone } from '@/app/(app)/tareas/actions';
import { deleteEvent } from '@/app/(app)/familia/actions';
import { IDLE_STATE } from '@/lib/action';
import { cn } from '@/lib/utils';
import { longDateLabel } from '@/lib/planning/dates';
import type { AgendaItem } from '@/services/planning';
import { Sheet } from '@/components/ui/sheet';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InlineMessage } from '@/components/ui/inline-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { toast } from '@/components/ui/toast';
import { BlockForm, AREA_CHOICES } from './block-form';
import { ChoiceChips } from './chips';

const SCOPES = [
  { value: 'solo', label: 'Solo este día' },
  { value: 'desde', label: 'Desde este día' },
  { value: 'toda', label: 'Toda la rutina' },
] as const;

function OccurrenceForm({ item, onDone }: { item: AgendaItem; onDone: () => void }) {
  const [state, formAction] = useActionState(editOccurrence, IDLE_STATE);
  const [scope, setScope] = useState<'solo' | 'desde' | 'toda' | ''>('solo');
  const [area, setArea] = useState<string>(item.area ?? '');
  const err = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? 'Guardado.');
      onDone();
    }
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="routine_id" value={item.id} />
      <input type="hidden" name="occurrence_date" value={item.occurrenceDate} />
      <input type="hidden" name="scope" value={scope || 'solo'} />
      <input type="hidden" name="area" value={area} />

      <Field label="Nombre" htmlFor="occ-title" error={err.title}>
        <Input id="occ-title" name="title" required defaultValue={item.title} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Desde" htmlFor="occ-start" error={err.start}>
          <Input id="occ-start" type="time" name="start" required defaultValue={item.start ?? ''} />
        </Field>
        <Field label="Hasta" htmlFor="occ-end" error={err.end}>
          <Input id="occ-end" type="time" name="end" required defaultValue={item.end ?? ''} />
        </Field>
        {scope === 'solo' && (
          <Field label="Mover a otro día (opcional)" htmlFor="occ-date" className="col-span-2">
            <Input id="occ-date" type="date" name="date" defaultValue={item.date} />
          </Field>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-2 px-1">Área</p>
        <ChoiceChips label="Área" value={area} onChange={setArea} allowNone options={AREA_CHOICES} />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-2 px-1">¿Qué cambiar?</p>
        <ChoiceChips label="Alcance del cambio" value={scope} onChange={setScope} options={[...SCOPES]} />
      </div>
      <InlineMessage state={state.ok ? undefined : state} />
      <SubmitButton pendingText="Guardando…" className="w-full min-h-12">
        Guardar
      </SubmitButton>
    </form>
  );
}

function FamilyEventForm({ item, onDone }: { item: AgendaItem; onDone: () => void }) {
  const [state, formAction] = useActionState(updateFamilyEvent, IDLE_STATE);
  const err = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? 'Guardado.');
      onDone();
    }
  }, [state, onDone]);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={item.id} />
      <Field label="Nombre" htmlFor="fe-title" error={err.title}>
        <Input id="fe-title" name="title" required defaultValue={item.title} />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Día" htmlFor="fe-date" className="col-span-3 sm:col-span-1">
          <Input id="fe-date" type="date" name="date" required defaultValue={item.date} />
        </Field>
        <Field label="Desde" htmlFor="fe-start">
          <Input id="fe-start" type="time" name="start" defaultValue={item.start ?? ''} />
        </Field>
        <Field label="Hasta" htmlFor="fe-end" error={err.end}>
          <Input id="fe-end" type="time" name="end" defaultValue={item.end ?? ''} />
        </Field>
      </div>
      <p className="text-sm text-ink-3">Evento del hogar: lo ve toda la familia.</p>
      <InlineMessage state={state.ok ? undefined : state} />
      <SubmitButton pendingText="Guardando…" className="w-full min-h-12">
        Guardar cambios
      </SubmitButton>
    </form>
  );
}

const dangerLink =
  'w-full inline-flex items-center justify-center gap-2 min-h-11 rounded-xl border border-line text-sm font-medium text-ink-2 hover:text-danger hover:border-danger/30';

function ItemDetail({ item, onDone }: { item: AgendaItem; onDone: () => void }) {
  if (item.source === 'task') {
    return (
      <div className="space-y-4">
        <p className="text-[15px] text-ink-2">
          {longDateLabel(item.date)}
          {item.start && ` · ${item.start}`}
        </p>
        <form action={toggleTaskDone} onSubmit={() => setTimeout(onDone, 50)}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="done" value={String(Boolean(item.done))} />
          <SubmitButton className="w-full min-h-12">{item.done ? 'Marcar como pendiente' : 'Marcar como hecha'}</SubmitButton>
        </form>
        <Link href={item.area === 'trabajo' ? '/trabajo' : '/capturas?ver=todas'} className="block text-center text-sm font-medium text-accent min-h-11 leading-[44px]">
          Editar en {item.area === 'trabajo' ? 'Trabajo' : 'Tareas'}
        </Link>
      </div>
    );
  }

  if (item.source === 'routine') {
    return (
      <div className="space-y-5">
        <p className="flex items-center gap-2 text-sm text-ink-3">
          <Repeat size={14} /> Rutina · {longDateLabel(item.occurrenceDate ?? item.date)}
        </p>
        <OccurrenceForm item={item} onDone={onDone} />
        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-line">
          <form action={removeOccurrence} onSubmit={() => setTimeout(onDone, 50)}>
            <input type="hidden" name="routine_id" value={item.id} />
            <input type="hidden" name="occurrence_date" value={item.occurrenceDate} />
            <input type="hidden" name="scope" value="solo" />
            <button type="submit" className={dangerLink}>
              Saltar solo este día
            </button>
          </form>
          <ConfirmAction
            action={removeOccurrence}
            fields={{ routine_id: item.id, occurrence_date: item.occurrenceDate ?? item.date, scope: 'desde' }}
            title="¿Terminar la rutina desde este día?"
            message="Los días anteriores quedan como estaban. Puedes volver a crearla cuando quieras."
            confirmLabel="Terminar"
            triggerClassName={dangerLink}
          >
            <Trash2 size={15} /> Terminar desde este día
          </ConfirmAction>
        </div>
      </div>
    );
  }

  if (item.source === 'family') {
    return (
      <div className="space-y-5">
        <FamilyEventForm item={item} onDone={onDone} />
        <ConfirmAction
          action={deleteEvent}
          fields={{ id: item.id }}
          title="¿Eliminar este evento?"
          message="Se borra del calendario de todo el hogar."
          confirmLabel="Eliminar"
          triggerClassName={dangerLink}
        >
          <Trash2 size={15} /> Eliminar evento
        </ConfirmAction>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BlockForm
        initial={{
          id: item.id,
          kind: item.source === 'event' ? 'event' : 'block',
          title: item.title,
          notes: item.notes,
          area: item.area,
          date: item.date,
          start: item.start,
          end: item.end,
          shared: item.shared,
        }}
        onDone={onDone}
      />
      <ConfirmAction
        action={deleteBlock}
        fields={{ id: item.id }}
        title="¿Eliminar de la agenda?"
        message="Se quita este bloque. No afecta tus tareas ni tus rutinas."
        confirmLabel="Eliminar"
        triggerClassName={dangerLink}
      >
        <Trash2 size={15} /> Eliminar
      </ConfirmAction>
    </div>
  );
}

/** Envuelve un ítem de la agenda: al tocarlo abre su detalle para editarlo. */
export function AgendaItemButton({ item, children, className }: { item: AgendaItem; children: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const editable = item.mine !== false || item.shared;
  return (
    <>
      <button
        type="button"
        onClick={() => editable && setOpen(true)}
        className={cn('block w-full text-left rounded-2xl', className)}
        aria-label={`${item.title}${item.start ? `, ${item.start}` : ''}. Ver detalle`}
      >
        {children}
      </button>
      <Sheet open={open} onClose={close} title={item.title}>
        <ItemDetail item={item} onDone={close} />
      </Sheet>
    </>
  );
}
