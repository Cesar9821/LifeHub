import Link from 'next/link';
import { ChevronRight, Target, Zap } from 'lucide-react';
import { loadProjects, PROJECT_STATUS_LABEL } from '@/services/projects';
import { getGoals } from '@/services/metas';
import { loadTasks } from '@/services/tasks';
import { Card, PageHeader, SectionHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { PlanningSetupCard } from '@/components/planning/setup-card';
import { ProjectFormButton } from '@/components/planning/project-form';
import { ProjectTime } from '@/components/planning/project-time';

export const dynamic = 'force-dynamic';

/** Proyectos personales: estado, próxima acción y tiempo reservado. Sin presión. */
export default async function ProyectosPage() {
  const [{ ready, projects }, { tasks }, goals] = await Promise.all([
    loadProjects(),
    loadTasks(),
    getGoals().catch(() => []),
  ]);
  const active = projects.filter((p) => p.status !== 'terminado');
  const done = projects.filter((p) => p.status === 'terminado');
  const openTasks = (id: string) => tasks.filter((t) => t.project_id === id && t.status !== 'completado').length;
  const activeGoals = goals.filter((g) => g.status === 'active');
  const hasInnvolt = projects.some((p) => /innvolt/i.test(p.name));

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader title="Proyectos" subtitle="Lo que estás construyendo, a tu ritmo.">
        {ready && <ProjectFormButton />}
      </PageHeader>
      {!ready && <PlanningSetupCard />}

      {ready && active.length === 0 && (
        <EmptyState icon={<Zap size={28} />} title="Agrega un proyecto cuando tengas algo que construir." text="Con un nombre y una próxima acción basta.">
          {!hasInnvolt && (
            <div className="mt-2">
              <ProjectFormButton
                label="Crear InnVolt"
                preset={{ name: 'InnVolt', status: 'preparacion', priority: 'baja', next_action: 'Revisar documentación', weekly_minutes: 60 }}
              />
            </div>
          )}
        </EmptyState>
      )}

      {active.length > 0 && (
        <ul className="space-y-3">
          {active.map((p) => (
            <li key={p.id}>
              <Link href={`/proyectos/${p.id}`} className="block rounded-3xl bg-surface border border-line p-5 hover:border-line-strong">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[17px] font-semibold text-ink">{p.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Chip tone={p.status === 'activo' ? 'success' : p.status === 'pausado' ? 'neutral' : 'accent'}>
                        {PROJECT_STATUS_LABEL[p.status]}
                      </Chip>
                      {p.priority === 'baja' && <Chip>Baja prioridad</Chip>}
                      {p.priority === 'alta' && <Chip tone="warning">Alta prioridad</Chip>}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-ink-3 shrink-0 mt-1" />
                </div>
                {p.next_action && (
                  <p className="mt-3 text-[15px] text-ink">
                    <span className="text-ink-3">Próxima acción: </span>
                    {p.next_action}
                  </p>
                )}
                <div className="mt-3">
                  <ProjectTime project={p} />
                </div>
                {openTasks(p.id) > 0 && <p className="mt-2 text-sm text-ink-3">{openTasks(p.id)} tareas abiertas</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {activeGoals.length > 0 && (
        <Card as="section" className="space-y-2">
          <SectionHeader title="Objetivos" icon={<Target size={18} />} href="/metas" action="Ver metas" className="-mt-2" />
          <p className="text-sm text-ink-3">Tus metas guardadas, vistas como objetivos.</p>
          <ul className="space-y-2">
            {activeGoals.slice(0, 5).map((g) => (
              <li key={g.id} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-[15px]">
                  <span className="truncate text-ink">{g.title}</span>
                  <span className="text-sm text-ink-3 tabular-nums shrink-0">{g.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden" aria-hidden>
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, g.progress)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {done.length > 0 && (
        <details>
          <summary className="cursor-pointer list-none min-h-11 inline-flex items-center px-1 text-sm font-medium text-ink-2">
            Terminados · {done.length}
          </summary>
          <ul className="mt-1 bg-surface border border-line rounded-3xl px-4 divide-y divide-line">
            {done.map((p) => (
              <li key={p.id}>
                <Link href={`/proyectos/${p.id}`} className="flex items-center min-h-12 text-[15px] text-ink-2">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
