'use client';

import { useActionState, useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { deleteFamilyDate, saveFamilyDate } from '@/app/(app)/bienestar/actions';
import { IDLE_STATE } from '@/lib/action';
import { dayMonthLabel } from '@/lib/planning/dates';
import { FAMILY_DATE_EMOJI, FAMILY_DATE_KIND_LABEL, whenLabel, type FamilyDateKind, type UpcomingDate } from '@/lib/wellbeing';
import { Chip } from '@/components/ui/chip';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InlineMessage } from '@/components/ui/inline-message';
import { Sheet } from '@/components/ui/sheet';
import { SubmitButton } from '@/components/ui/submit-button';
import { withSuccessToast } from '@/components/ui/toast';
import { ChoiceChips } from '@/components/planning/chips';
import type { FamilyDate } from '@/services/wellbeing';

const KINDS = (Object.keys(FAMILY_DATE_KIND_LABEL) as FamilyDateKind[]).map((k) => ({
  value: k,
  label: `${FAMILY_DATE_EMOJI[k]} ${FAMILY_DATE_KIND_LABEL[k]}`,
}));

/** Crear o editar un cumpleaños / fecha especial. */
export function FamilyDateForm({ item, onDone }: { item?: FamilyDate; onDone?: () => void }) {
  const [state, formAction] = useActionState(withSuccessToast(saveFamilyDate), IDLE_STATE);
  const [kind, setKind] = useState<FamilyDateKind | ''>(item?.kind ?? 'cumpleanos');
  const err = state.fieldErrors ?? {};
  const year = item?.year ?? 2000;
  const defaultDate = item ? `${year}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}` : '';
  useEffect(() => {
    if (state.ok) onDone?.();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="kind" value={kind || 'cumpleanos'} />
      <Field label="¿De quién o qué?" htmlFor="fd-name" error={err.name}>
        <Input
          id="fd-name"
          name="name"
          required
          maxLength={120}
          autoComplete="off"
          defaultValue={state.values?.name ?? item?.name ?? ''}
          placeholder="Ej: Sarita"
          invalid={!!err.name}
        />
      </Field>
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-2 px-1">Tipo</p>
        <ChoiceChips label="Tipo de fecha" value={kind} onChange={setKind} options={KINDS} />
      </div>
      <Field label="Fecha" htmlFor="fd-date" error={err.date} hint="Si no sabes el año, elige cualquiera y deja sin marcar la casilla de abajo.">
        <Input id="fd-date" type="date" name="date" required defaultValue={state.values?.date ?? defaultDate} className="max-w-48" />
      </Field>
      <label className="flex items-center justify-between gap-4 min-h-11 px-1 cursor-pointer">
        <span>
          <span className="block text-[15px] text-ink">Sé el año</span>
          <span className="block text-sm text-ink-3">Para mostrar cuántos años cumple</span>
        </span>
        <input type="checkbox" name="know_year" defaultChecked={item ? item.year != null : true} className="h-5 w-5 accent-[var(--color-accent)] shrink-0" />
      </label>
      <Field label="Nota (opcional)" htmlFor="fd-notes">
        <Input id="fd-notes" name="notes" maxLength={300} defaultValue={item?.notes ?? ''} placeholder="Ej: Le gustan los libros de dinosaurios" />
      </Field>
      <InlineMessage state={state.ok ? undefined : state} />
      <SubmitButton pendingText="Guardando…" className="w-full min-h-12">
        {item ? 'Guardar cambios' : 'Agregar fecha'}
      </SubmitButton>
    </form>
  );
}

function Row({ u }: { u: UpcomingDate<FamilyDate> }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const d = u.item;
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="h-11 w-11 shrink-0 rounded-2xl bg-surface-3 inline-flex items-center justify-center text-xl" aria-hidden>
        {FAMILY_DATE_EMOJI[d.kind]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-ink truncate">
          {d.name}
          {u.turning != null && d.kind === 'cumpleanos' && <span className="text-ink-3 font-normal"> · cumple {u.turning}</span>}
          {u.turning != null && d.kind === 'aniversario' && <span className="text-ink-3 font-normal"> · {u.turning} años</span>}
        </p>
        <p className="text-sm text-ink-3">
          {dayMonthLabel(u.date)} · {FAMILY_DATE_KIND_LABEL[d.kind]}
          {d.notes && ` · ${d.notes}`}
        </p>
      </div>
      <Chip tone={u.days === 0 ? 'success' : u.days <= 7 ? 'accent' : 'neutral'}>{whenLabel(u.days)}</Chip>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Editar ${d.name}`}
        className="h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-xl text-ink-3 hover:text-ink hover:bg-surface-2"
      >
        <Pencil size={16} />
      </button>
      <Sheet open={open} onClose={close} title="Editar fecha">
        <FamilyDateForm item={d} onDone={close} />
        <div className="mt-4 pt-4 border-t border-line">
          <ConfirmAction
            action={deleteFamilyDate}
            fields={{ id: d.id }}
            title={`¿Eliminar "${d.name}"?`}
            message="Se borra para todo el hogar."
            confirmLabel="Eliminar"
            triggerClassName="w-full inline-flex items-center justify-center gap-2 min-h-11 rounded-xl border border-line text-sm font-medium text-ink-2 hover:text-danger hover:border-danger/30"
          >
            <Trash2 size={15} /> Eliminar fecha
          </ConfirmAction>
        </div>
      </Sheet>
    </li>
  );
}

/** Pestaña "Fechas" de Hogar: cumpleaños y fechas especiales, por cercanía. */
export function FamilyDates({ upcoming }: { upcoming: UpcomingDate<FamilyDate>[] }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <section aria-label="Cumpleaños y fechas especiales" className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-ink text-bg text-sm font-semibold hover:bg-white"
      >
        <Plus size={16} /> Agregar fecha
      </button>
      {upcoming.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-2 rounded-3xl border border-dashed border-line-strong px-6 py-8">
          <span className="text-3xl" aria-hidden>
            🎂
          </span>
          <p className="text-[15px] font-semibold text-ink">Sin fechas todavía</p>
          <p className="text-sm text-ink-2 max-w-xs">Agrega cumpleaños y aniversarios. Te avisamos el día antes y el mismo día.</p>
        </div>
      ) : (
        <ul className="bg-surface border border-line rounded-3xl px-4 divide-y divide-line">
          {upcoming.map((u) => (
            <Row key={u.item.id} u={u} />
          ))}
        </ul>
      )}
      <Sheet open={open} onClose={close} title="Nueva fecha">
        <FamilyDateForm onDone={close} />
      </Sheet>
    </section>
  );
}
