import { cn } from '@/lib/utils';

/** Colores de las áreas en órbita: trabajo, hábitos, salud, finanzas, hogar, proyectos. */
const AREAS = ['#60a5fa', '#2dd4bf', '#34d399', '#a3e635', '#fb923c', '#c084fc'];
const NODES = AREAS.map((color, i) => {
  const a = ((-90 + i * 60) * Math.PI) / 180;
  return { color, x: 50 + 34 * Math.cos(a), y: 50 + 34 * Math.sin(a) };
});

/**
 * Marca de LifeHub: tú al centro y tus áreas de vida en órbita (el mismo
 * dibujo del ícono de la app). Decorativa: el nombre va en texto al lado.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={cn('shrink-0', className)}>
      <circle cx="50" cy="50" r="34" fill="none" stroke="#8b9cff" strokeOpacity="0.35" strokeWidth="2" />
      {NODES.map((n) => (
        <line key={`l${n.color}`} x1="50" y1="50" x2={n.x} y2={n.y} stroke="#ffffff" strokeOpacity="0.14" strokeWidth="2" />
      ))}
      {NODES.map((n) => (
        <circle key={n.color} cx={n.x} cy={n.y} r="8" fill={n.color} />
      ))}
      <circle cx="50" cy="50" r="17" fill="#8b9cff" />
      <circle cx="50" cy="50" r="6" fill="#ffffff" />
    </svg>
  );
}
