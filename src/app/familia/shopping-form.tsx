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
      className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl bg-white text-black hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
    >
      {pending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
    </button>
  );
}

export default function ShoppingForm() {
  const [state, formAction] = useActionState(addShoppingItem, IDLE_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-2">
      <form
        ref={formRef}
        action={formAction}
        className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-4 md:p-5 backdrop-blur-xl flex items-center gap-3"
      >
        <Input name="name" required placeholder="Producto…" className="flex-1" invalid={!!state.fieldErrors?.name} />
        <Input name="quantity" placeholder="Cant." className="w-20 md:w-28" />
        <AddButton />
      </form>
      {!state.ok && <InlineMessage state={state} />}
    </div>
  );
}
