import { durationLabel } from '@/lib/planning/dates';
import type { Project } from '@/services/projects';

/** Tiempo de la semana en tono tranquilo: nunca alarma si no se agendó. */
export function ProjectTime({ project }: { project: Project }) {
  const { weekly_minutes: target, scheduledMinutes: done, priority } = project;
  if (target === 0 && done === 0) {
    return <p className="text-sm text-ink-3">Sin tiempo reservado por ahora.</p>;
  }
  if (target > 0 && done === 0) {
    return (
      <p className="text-sm text-ink-2">
        {durationLabel(target)} disponible esta semana
        {priority === 'baja' ? ' · cuando puedas, sin presión.' : ' · aún sin hora agendada.'}
      </p>
    );
  }
  const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 100;
  return (
    <div className="space-y-1.5">
      <p className="text-sm text-ink-2">
        {durationLabel(done)} agendada{target > 0 ? ` de ${durationLabel(target)}` : ''} esta semana
      </p>
      {target > 0 && (
        <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden" aria-hidden>
          <div className="h-full rounded-full bg-area-proyectos" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
