import { Swords, Quote } from 'lucide-react';
import { getToday369 } from '@/services/manifest369';
import { phraseOfDay } from '@/lib/mindset-phrases';
import Manifest369 from './manifest-369';

export const dynamic = 'force-dynamic';

export default async function ForjaPage() {
  const state = await getToday369();
  const phrase = phraseOfDay();

  return (
    <div className="space-y-8 pb-20 max-w-4xl">
      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 backdrop-blur-md w-fit">
          <Swords size={13} className="text-violet-400" />
          <span className="text-[10px] font-bold text-violet-400/80 uppercase tracking-[0.2em]">
            Mentalidad inquebrantable
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic leading-none">
          La Forja<span className="text-violet-400">.</span>
        </h1>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] max-w-md">
          Se forja cada día. Enciende con una idea, graba tu meta con el método 369.
        </p>
      </div>

      {/* FRASE DEL DÍA */}
      <div className="relative bg-gradient-to-br from-violet-600/10 to-transparent border border-violet-500/15 rounded-[2rem] p-6 md:p-8 overflow-hidden">
        <Quote size={80} className="absolute -right-4 -top-4 text-violet-500/10" />
        <p className="relative text-lg md:text-2xl font-black text-white italic leading-snug tracking-tight">
          &ldquo;{phrase.text}&rdquo;
        </p>
        <p className="relative mt-3 text-[10px] font-black text-violet-400 uppercase tracking-[0.2em]">
          {phrase.source}
        </p>
      </div>

      {/* MÉTODO 369 */}
      <Manifest369 state={state} />
    </div>
  );
}
