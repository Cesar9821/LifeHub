'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { addShoppingItem } from './actions';
import { IDLE_STATE } from '@/lib/action';
import { Input } from '@/components/ui/input';
import { InlineMessage } from '@/components/ui/inline-message';

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50"
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
    </button>
  );
}

export default function ShoppingForm({ listId }: { listId: string }) {
  const [state, formAction] = useActionState(addShoppingItem, IDLE_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-2">
      <form ref={formRef} action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="list_id" value={listId} />
        <Input name="name" required defaultValue={state.values?.name ?? ''} placeholder="Agregar producto…" className="flex-1 py-2.5" invalid={!!state.fieldErrors?.name} />
        <Input name="quantity" defaultValue={state.values?.quantity ?? ''} placeholder="Cant." className="w-16 md:w-24 py-2.5" />
        <AddButton />
      </form>
      {!state.ok && <InlineMessage state={state} />}
    </div>
  );
}
