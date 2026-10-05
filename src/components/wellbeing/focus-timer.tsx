'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Pause, Play, Square, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logFocusSession } from '@/app/(app)/bienestar/actions';
import { toast } from '@/components/ui/toast';

export interface FocusTask {
  id: string;
  title: string;
  area: string | null;
}

const PRESETS = [15, 25, 45, 60];
const KEY = 'lifehub-focus';

interface Running {
  /** Fin previsto (ms). Si está en pausa, null y se usa `left`. */
  endAt: number | null;
  /** Milisegundos que quedaban al pausar. */
  left: number;
  minutes: number;
  task: FocusTask | null;
  title: string;
}

function load(): Running | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Running) : null;
  } catch {
    return null;
  }
}
function persist(r: Running | null) {
  try {
    if (r) localStorage.setItem(KEY, JSON.stringify(r));
    else localStorage.removeItem(KEY);
  } catch {
    // Sin almacenamiento: el temporizador sigue funcionando mientras la página esté abierta.
  }
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.15, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.2);
    });
    if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.([200, 100, 200]);
  } catch {
    // Sin audio: el aviso visual basta.
  }
}

/** Temporizador de enfoque: elegir tarea y minutos, y a trabajar sin distracciones. */
export function FocusTimer({ tasks, initialTaskId }: { tasks: FocusTask[]; initialTaskId: string | null }) {
  const router = useRouter();
  const [run, setRun] = useState<Running | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [minutes, setMinutes] = useState(25);
  const [taskId, setTaskId] = useState<string>(initialTaskId ?? '');
  const [free, setFree] = useState('');
  const [finished, setFinished] = useState<Running | null>(null);
  const [pending, start] = useTransition();
  const lock = useRef<{ release: () => Promise<void> } | null>(null);

  // Retoma una sesión en curso (por si se recargó la página).
  useEffect(() => {
    const saved = load();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leer localStorage solo es posible en el cliente
    if (saved) setRun(saved);
  }, []);

  const left = run ? (run.endAt != null ? run.endAt - now : run.left) : 0;
  const paused = run != null && run.endAt == null;

  // Reloj + pantalla encendida mientras corre.
  useEffect(() => {
    if (!run || paused) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    (navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock
      ?.request('screen')
      .then((l) => (lock.current = l))
      .catch(() => {});
    return () => {
      clearInterval(t);
      lock.current?.release().catch(() => {});
      lock.current = null;
    };
  }, [run, paused]);

  // Fin del tiempo.
  useEffect(() => {
    if (run && !paused && left <= 0) {
      beep();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- el fin del tiempo depende del reloj
      setFinished(run);
      setRun(null);
      persist(null);
    }
  }, [run, paused, left]);

  // Tiempo restante en la pestaña.
  useEffect(() => {
    const base = 'Enfoque · LifeHub';
    document.title = run ? `${mmss(left)} · ${run.title || 'Enfoque'}` : base;
    return () => {
      document.title = 'LifeHub';
    };
  }, [run, left]);

  const begin = () => {
    const task = tasks.find((t) => t.id === taskId) ?? null;
    const title = task?.title ?? free.trim();
    const r: Running = { endAt: Date.now() + minutes * 60_000, left: minutes * 60_000, minutes, task, title };
    setNow(Date.now());
    setRun(r);
    setFinished(null);
    persist(r);
  };

  const togglePause = () => {
    if (!run) return;
    const r: Running = paused
      ? { ...run, endAt: Date.now() + run.left }
      : { ...run, endAt: null, left: Math.max(0, (run.endAt ?? 0) - Date.now()) };
    setNow(Date.now());
    setRun(r);
    persist(r);
  };

  const stopEarly = () => {
    if (!run) return;
    const done = Math.round((run.minutes * 60_000 - left) / 60_000);
    setRun(null);
    persist(null);
    if (done >= 1) setFinished({ ...run, minutes: done });
    else toast('Sesión cancelada.');
  };

  const save = useCallback(
    (complete: boolean) => {
      if (!finished) return;
      start(async () => {
        const fd = new FormData();
        fd.set('minutes', String(finished.minutes));
        if (finished.task) {
          fd.set('task_id', finished.task.id);
          if (finished.task.area) fd.set('area', finished.task.area);
        }
        if (finished.title) fd.set('title', finished.title);
        if (complete) fd.set('complete', 'true');
        const r = await logFocusSession(fd);
        toast(r.message ?? (r.ok ? 'Guardado.' : 'No se pudo guardar.'));
        if (r.ok) {
          setFinished(null);
          router.refresh();
        }
      });
    },
    [finished, router]
  );

  const total = run ? run.minutes * 60_000 : minutes * 60_000;
  const progress = run ? 1 - Math.max(0, left) / total : 0;
  const R = 110;
  const C = 2 * Math.PI * R;

  if (finished) {
    return (
      <section aria-label="Sesión terminada" className="rounded-3xl border border-success/30 bg-success/10 p-6 text-center space-y-4 animate-pop">
        <p className="text-4xl" aria-hidden>
          ✅
        </p>
        <div>
          <p className="text-[20px] font-semibold text-ink">¡{finished.minutes} minutos de enfoque!</p>
          {finished.title && <p className="text-[15px] text-ink-2">{finished.title}</p>}
        </div>
        <div className="flex flex-col gap-2">
          {finished.task && (
            <button
              type="button"
              disabled={pending}
              onClick={() => save(true)}
              className="inline-flex items-center justify-center gap-2 min-h-12 rounded-xl bg-ink text-bg text-[15px] font-semibold hover:bg-white disabled:opacity-60"
            >
              <Check size={18} /> Guardar y marcar la tarea como hecha
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => save(false)}
            className={cn(
              'inline-flex items-center justify-center min-h-12 rounded-xl text-[15px] font-semibold disabled:opacity-60',
              finished.task ? 'border border-line-strong text-ink hover:bg-surface-2' : 'bg-ink text-bg hover:bg-white'
            )}
          >
            Guardar sesión
          </button>
          <button type="button" onClick={() => setFinished(null)} className="min-h-11 text-sm font-medium text-ink-3 hover:text-ink">
            Descartar
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Temporizador de enfoque" className="space-y-6">
      <div className="relative mx-auto w-full max-w-[260px] aspect-square">
        <svg viewBox="0 0 260 260" className="w-full h-full -rotate-90" aria-hidden>
          <circle cx="130" cy="130" r={R} fill="none" stroke="var(--color-surface-3)" strokeWidth="12" />
          <circle
            cx="130"
            cy="130"
            r={R}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            className="transition-[stroke-dashoffset] duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="text-5xl font-semibold tabular-nums tracking-tight text-ink" role="timer" aria-live="off">
            {run ? mmss(left) : mmss(minutes * 60_000)}
          </p>
          <p className="mt-1 text-sm text-ink-3 line-clamp-2">{run ? (paused ? 'En pausa' : run.title || 'Enfocado') : 'Listo para partir'}</p>
        </div>
      </div>

      {run ? (
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={togglePause}
            className="inline-flex items-center gap-2 min-h-12 px-5 rounded-xl bg-ink text-bg text-[15px] font-semibold hover:bg-white"
          >
            {paused ? <Play size={18} /> : <Pause size={18} />} {paused ? 'Seguir' : 'Pausar'}
          </button>
          <button
            type="button"
            onClick={stopEarly}
            className="inline-flex items-center gap-2 min-h-12 px-5 rounded-xl border border-line-strong text-[15px] font-medium text-ink-2 hover:text-ink"
          >
            <Square size={16} /> Terminar
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="focus-task" className="block text-xs font-medium text-ink-2 px-1">
              ¿En qué te vas a enfocar?
            </label>
            {tasks.length > 0 && (
              <select
                id="focus-task"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full min-h-12 bg-surface-2 border border-line-strong rounded-xl px-3 text-[15px] text-ink outline-none focus:border-accent"
              >
                <option value="">Otra cosa (escribir)</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            )}
            {(!taskId || tasks.length === 0) && (
              <input
                id={tasks.length === 0 ? 'focus-task' : undefined}
                aria-label="Escribe en qué te vas a enfocar"
                value={free}
                onChange={(e) => setFree(e.target.value)}
                maxLength={300}
                placeholder="Ej: Preparar la cotización"
                className="w-full min-h-12 bg-surface-2 border border-line-strong rounded-xl px-3 text-[15px] text-ink placeholder:text-ink-3 outline-none focus:border-accent"
              />
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-ink-2 px-1">Minutos</p>
            <div role="radiogroup" aria-label="Minutos" className="flex flex-wrap gap-2">
              {PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={minutes === m}
                  onClick={() => setMinutes(m)}
                  className={cn(
                    'min-h-11 min-w-14 px-4 rounded-full border text-sm font-medium tabular-nums',
                    minutes === m ? 'bg-ink text-bg border-ink' : 'bg-surface border-line-strong text-ink-2 hover:text-ink'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={begin}
            className="w-full inline-flex items-center justify-center gap-2 min-h-12 rounded-xl bg-ink text-bg text-[15px] font-semibold hover:bg-white"
          >
            <Timer size={18} /> Empezar {minutes} min
          </button>
          <p className="text-sm text-ink-3 text-center">Silencia el celular. La pantalla se mantiene encendida mientras corre.</p>
        </div>
      )}
    </section>
  );
}
