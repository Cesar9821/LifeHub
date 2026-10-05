import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { todayStr } from '@/lib/format';
import { loadProjects, PROJECT_PRIORITY_LABEL, PROJECT_STATUS_LABEL } from '@/services/projects';
import { loadTasks } from '@/services/tasks';
import { deleteProject } from '../actions';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { ProjectFormButton } from '@/components/planning/project-form';
import { ProjectTime } from '@/components/planning/project-time';
import { TaskRow } from '@/components/planning/task-row';
import { QuickAddTask } from '@/components/planning/new-task-button';
import { AddBlockButton } from '@/components/planning/week-parts';

export const dynamic = 'force-dynamic';

export default async function ProyectoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const today = todayStr();
  const [{ projects }, { tasks }] = await Promise.all([loadProjects(), loadTasks()]);
  const project = projects.find((p) => p.id === id);
  if (!project) notFound();

  const projectTasks = tasks.filter((t) => t.project_id === id);
  const open = projectTasks.filter((t) => t.status !== 'completado');
  const done = projectTasks.filter((t) => t.status === 'completado');

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link href="/proyectos" className="inline-flex items-center gap-1.5 min-h-11 text-sm font-medium text-ink-2 hover:text-ink">
        <ArrowLeft size={16} /> Proyectos
      </Link>

      <header className="space-y-2">
        <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-ink">⚡ {project.name}</h1>
        <div className="flex flex-wrap gap-1.5">
          <Chip tone={project.status === 'activo' ? 'success' : 'accent'}>{PROJECT_STATUS_LABEL[project.status]}</Chip>
          <Chip>{PROJECT_PRIORITY_LABEL[project.priority]}</Chip>
        </div>
        {project.priority === 'baja' && (
          <p className="text-[15px] text-ink-2">Ahora la prioridad es otra. La idea es mantenerlo vivo, sin presión.</p>
        )}
      </header>

      <Card as="section" className="space-y-1">
        <p className="text-sm text-ink-3">Próxima acción</p>
        <p className="text-[17px] font-semibold text-ink">{project.next_action || 'Sin definir. ¿Cuál es el paso más chico?'}</p>
      </Card>

      <Card as="section" className="space-y-3">
        <p className="text-[15px] font-semibold text-ink">Tiempo esta semana</p>
        <ProjectTime project={project} />
        <AddBlockButton
          initial={{ date: today, title: project.name, area: 'proyectos', project_id: project.id }}
          label="Reservar un rato"
          className="w-full"
        />
      </Card>

      <section className="space-y-2" aria-label="Tareas del proyecto">
        <h2 className="text-[16px] font-semibold text-ink px-1">Tareas</h2>
        <QuickAddTask defaults={{ area: 'proyectos', project_id: project.id }} placeholder="Agregar tarea del proyecto" />
        {open.length > 0 ? (
          <ul className="bg-surface border border-line rounded-3xl px-3 divide-y divide-line">
            {open.map((t) => (
              <TaskRow key={t.id} task={t} today={today} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-3 px-1">Sin tareas abiertas.</p>
        )}
        {done.length > 0 && <p className="text-sm text-ink-3 px-1">{done.length} completadas en las últimas 2 semanas.</p>}
      </section>

      {project.notes && (
        <Card as="section" className="space-y-1">
          <p className="text-sm text-ink-3">Notas</p>
          <p className="text-[15px] text-ink whitespace-pre-line">{project.notes}</p>
        </Card>
      )}

      {project.mine && (
        <div className="flex flex-wrap gap-2">
          <ProjectFormButton project={project} />
          <ConfirmAction
            action={deleteProject}
            fields={{ id: project.id }}
            title={`¿Eliminar "${project.name}"?`}
            message="Sus tareas y bloques no se borran: quedan sin proyecto. Si solo quieres dejarlo de lado, mejor ponerlo En pausa."
            confirmLabel="Eliminar"
            triggerClassName="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl border border-line text-sm font-medium text-ink-2 hover:text-danger hover:border-danger/30"
          >
            <Trash2 size={16} /> Eliminar
          </ConfirmAction>
        </div>
      )}
    </div>
  );
}
