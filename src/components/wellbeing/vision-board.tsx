'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Pencil, Trash2 } from 'lucide-react';
import { deleteVisionItem, saveVisionItem } from '@/app/(app)/bienestar/actions';
import { IDLE_STATE } from '@/lib/action';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { InlineMessage } from '@/components/ui/inline-message';
import { Sheet } from '@/components/ui/sheet';
import { SubmitButton } from '@/components/ui/submit-button';
import { withSuccessToast } from '@/components/ui/toast';
import type { VisionItem } from '@/services/wellbeing';

export interface GoalOption {
  id: string;
  title: string;
}

const MAX_CHARS = 650_000;

/** Reduce la foto en el celular (máx. 1200 px, JPEG) para guardarla liviana. */
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('No se pudo leer la foto.'));
      i.src = url;
    });
    for (const [max, q] of [
      [1200, 0.8],
      [1000, 0.7],
      [800, 0.6],
      [600, 0.55],
    ] as const) {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg', q);
      if (data.length <= MAX_CHARS) return data;
    }
    throw new Error('La foto es muy pesada. Prueba con otra.');
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Agregar o editar una imagen del tablero. */
export function VisionForm({ item, goals, onDone }: { item?: VisionItem; goals: GoalOption[]; onDone?: () => void }) {
  const [state, formAction] = useActionState(withSuccessToast(saveVisionItem), IDLE_STATE);
  const [image, setImage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const err = state.fieldErrors ?? {};
  const preview = image || item?.image_data || '';
  useEffect(() => {
    if (state.ok) onDone?.();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      {item && <input type="hidden" name="id" value={item.id} />}
      {image && <input type="hidden" name="image_data" value={image} />}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-full aspect-[16/10] rounded-2xl border border-dashed border-line-strong bg-surface-2 overflow-hidden flex items-center justify-center text-ink-2 hover:text-ink"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Vista previa" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-sm font-medium">
              <ImagePlus size={28} /> {busy ? 'Preparando foto…' : 'Elegir foto'}
            </span>
          )}
        </button>
        {preview && (
          <button type="button" onClick={() => fileRef.current?.click()} className="min-h-11 px-1 text-sm font-medium text-accent">
            Cambiar foto
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Foto"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            setError(null);
            try {
              setImage(await shrink(f));
            } catch (x) {
              setError(x instanceof Error ? x.message : 'No se pudo leer la foto.');
            } finally {
              setBusy(false);
              e.target.value = '';
            }
          }}
        />
        {error && <p className="text-sm text-danger px-1">{error}</p>}
      </div>
      <Field label="Frase" htmlFor="vision-title" error={err.title} hint="Escríbela como si ya fuera realidad.">
        <Input
          id="vision-title"
          name="title"
          required
          maxLength={120}
          defaultValue={state.values?.title ?? item?.title ?? ''}
          placeholder="Ej: Nuestra casa con patio grande"
          invalid={!!err.title}
        />
      </Field>
      {goals.length > 0 && (
        <Field label="Objetivo relacionado (opcional)" htmlFor="vision-goal">
          <Select id="vision-goal" name="goal_id" defaultValue={item?.goal_id ?? ''}>
            <option value="">Ninguno</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <InlineMessage state={state.ok ? undefined : state} />
      <SubmitButton pendingText="Guardando…" className="w-full min-h-12" disabled={busy}>
        {item ? 'Guardar cambios' : 'Agregar al tablero'}
      </SubmitButton>
    </form>
  );
}

function Tile({ item, goals, goalName }: { item: VisionItem; goals: GoalOption[]; goalName: string | null }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <li className="relative overflow-hidden rounded-3xl border border-line aspect-[4/5] sm:aspect-[16/11] bg-surface-2">
      {item.image_data && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_data} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pt-10">
        <p className="text-[16px] font-semibold leading-snug text-white">{item.title}</p>
        {goalName && <p className="mt-0.5 text-xs text-white/70">🎯 {goalName}</p>}
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Editar: ${item.title}`}
        className="absolute top-2 right-2 h-11 w-11 inline-flex items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65"
      >
        <Pencil size={16} />
      </button>
      <Sheet open={open} onClose={close} title="Editar visión">
        <VisionForm item={item} goals={goals} onDone={close} />
        <div className="mt-4 pt-4 border-t border-line">
          <ConfirmAction
            action={deleteVisionItem}
            fields={{ id: item.id }}
            title="¿Quitar del tablero?"
            message={`"${item.title}" se borra del tablero.`}
            confirmLabel="Quitar"
            triggerClassName="w-full inline-flex items-center justify-center gap-2 min-h-11 rounded-xl border border-line text-sm font-medium text-ink-2 hover:text-danger hover:border-danger/30"
          >
            <Trash2 size={15} /> Quitar del tablero
          </ConfirmAction>
        </div>
      </Sheet>
    </li>
  );
}

/** Tablero de visión: tus metas en imágenes. */
export function VisionBoard({ items, goals }: { items: VisionItem[]; goals: GoalOption[] }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const goalName = new Map(goals.map((g) => [g.id, g.title]));
  return (
    <section aria-label="Tablero de visión" className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-ink text-bg text-sm font-semibold hover:bg-white"
      >
        <ImagePlus size={16} /> Agregar imagen
      </button>
      {items.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-2 rounded-3xl border border-dashed border-line-strong px-6 py-10">
          <span className="text-3xl" aria-hidden>
            🌅
          </span>
          <p className="text-[15px] font-semibold text-ink">Tu tablero está vacío</p>
          <p className="text-sm text-ink-2 max-w-xs">
            Sube fotos de lo que quieres lograr: un viaje, la casa, tu salud, tu familia. Cada día verás una en Hoy.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((it) => (
            <Tile key={it.id} item={it} goals={goals} goalName={it.goal_id ? goalName.get(it.goal_id) ?? null : null} />
          ))}
        </ul>
      )}
      <Sheet open={open} onClose={close} title="Nueva imagen">
        <VisionForm goals={goals} onDone={close} />
      </Sheet>
    </section>
  );
}
