import { WHEEL_AREAS, WHEEL_LABEL, type Wheel } from '@/lib/wellbeing';

const SIZE = 300;
const C = SIZE / 2;
const R = 100;

function point(i: number, value: number, radius = R) {
  const a = (-90 + (i * 360) / WHEEL_AREAS.length) * (Math.PI / 180);
  const r = (Math.max(0, Math.min(10, value)) / 10) * radius;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
}

const polygon = (w: Wheel) =>
  WHEEL_AREAS.map((a, i) => {
    const p = point(i, w[a] ?? 0);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');

/**
 * Rueda de la vida: tu nota (1–10) por área. La semana anterior aparece como
 * contorno gris para comparar. Los números exactos van en la lista de abajo.
 */
export function WheelChart({ self, previous }: { self: Wheel; previous: Wheel | null }) {
  const hasSelf = WHEEL_AREAS.some((a) => self[a] != null);
  return (
    <figure className="space-y-2">
      <svg viewBox={`-56 -6 ${SIZE + 112} ${SIZE + 12}`} className="mx-auto w-full max-w-[360px]" role="img" aria-label="Rueda de la vida de la semana">
        {/* Anillos 2, 4, 6, 8, 10 */}
        {[2, 4, 6, 8, 10].map((v) => (
          <polygon
            key={v}
            points={WHEEL_AREAS.map((_, i) => {
              const p = point(i, v);
              return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
            }).join(' ')}
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="1"
          />
        ))}
        {WHEEL_AREAS.map((a, i) => {
          const end = point(i, 10);
          const label = point(i, 10, R + 26);
          return (
            <g key={a}>
              <line x1={C} y1={C} x2={end.x} y2={end.y} stroke="var(--color-line)" strokeWidth="1" />
              <text
                x={label.x}
                y={label.y}
                textAnchor={Math.abs(label.x - C) < 4 ? 'middle' : label.x > C ? 'start' : 'end'}
                dominantBaseline="middle"
                fontSize="12"
                fill="var(--color-ink-2)"
              >
                {WHEEL_LABEL[a]}
              </text>
            </g>
          );
        })}
        {previous && (
          <polygon points={polygon(previous)} fill="none" stroke="var(--color-ink-3)" strokeWidth="2" strokeDasharray="5 4" />
        )}
        {hasSelf && (
          <>
            <polygon points={polygon(self)} fill="var(--color-accent)" fillOpacity="0.22" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" />
            {WHEEL_AREAS.map((a, i) => {
              if (self[a] == null) return null;
              const p = point(i, self[a]!);
              return (
                <circle key={a} cx={p.x} cy={p.y} r="5" fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth="2">
                  <title>{`${WHEEL_LABEL[a]}: ${self[a]}`}</title>
                </circle>
              );
            })}
          </>
        )}
      </svg>
      {previous && (
        <figcaption className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden /> Esta semana
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0 w-4 border-t-2 border-dashed border-ink-3" aria-hidden /> Semana anterior
          </span>
        </figcaption>
      )}
    </figure>
  );
}

/** Tabla legible: tu nota y la actividad registrada, área por área. */
export function WheelBars({ self, activity }: { self: Wheel; activity: Wheel }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-accent" aria-hidden /> Tu nota
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-ink-3/60" aria-hidden /> Actividad registrada
        </span>
      </div>
      <table className="w-full text-sm">
        <caption className="sr-only">Nota y actividad por área (de 0 a 10)</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Área</th>
            <th scope="col">Tu nota</th>
            <th scope="col">Actividad</th>
          </tr>
        </thead>
        <tbody>
          {WHEEL_AREAS.map((a) => (
            <tr key={a} className="align-middle">
              <th scope="row" className="w-24 py-1.5 pr-2 text-left font-medium text-ink">
                {WHEEL_LABEL[a]}
              </th>
              <td className="py-1.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden" aria-hidden>
                      <div className="h-full rounded-full bg-accent" style={{ width: `${((self[a] ?? 0) / 10) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right tabular-nums text-ink">{self[a] ?? '–'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden" aria-hidden>
                      <div className="h-full rounded-full bg-ink-3/60" style={{ width: `${((activity[a] ?? 0) / 10) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right tabular-nums text-ink-3">{activity[a] ?? 0}</span>
                  </div>
                </div>
              </td>
              <td className="sr-only">{activity[a] ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
