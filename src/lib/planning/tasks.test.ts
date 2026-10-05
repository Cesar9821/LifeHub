import { describe, expect, it } from 'vitest';
import { groupWorkTasks, isForToday, isInWeek, isOverdue, organizePatch, statusPatch, type TaskLike } from './tasks';
import { canAddPriority, MAX_PRIORITIES, nextPosition, suggestPriorities } from './priorities';

const today = '2026-10-07'; // miércoles
const base: TaskLike = {
  id: 't',
  title: 'Tarea',
  kind: 'task',
  status: 'pendiente',
  area: 'trabajo',
  category: null,
  due_date: null,
  due_time: null,
  planned_week: null,
  waiting_on: null,
  project_id: null,
  completed_at: null,
  created_at: '2026-10-01T10:00:00Z',
};
const t = (over: Partial<TaskLike>): TaskLike => ({ ...base, ...over });

describe('tareas', () => {
  it('va en Hoy si es de hoy, está atrasada o se eligió para hoy', () => {
    expect(isForToday(t({ due_date: today }), today)).toBe(true);
    expect(isForToday(t({ due_date: '2026-10-01' }), today)).toBe(true);
    expect(isForToday(t({ status: 'hoy' }), today)).toBe(true);
    expect(isForToday(t({ status: 'en_curso' }), today)).toBe(true);
    expect(isForToday(t({ due_date: '2026-10-09' }), today)).toBe(false);
    expect(isForToday(t({ status: 'inbox', due_date: today }), today)).toBe(false);
    expect(isForToday(t({ status: 'completado', due_date: today }), today)).toBe(false);
  });

  it('atrasada solo si está abierta y con fecha pasada', () => {
    expect(isOverdue(t({ due_date: '2026-10-06' }), today)).toBe(true);
    expect(isOverdue(t({ due_date: today }), today)).toBe(false);
    expect(isOverdue(t({ due_date: '2026-10-06', status: 'completado' }), today)).toBe(false);
  });

  it('semana por fecha o por planificación', () => {
    expect(isInWeek(t({ due_date: '2026-10-11' }), '2026-10-05')).toBe(true);
    expect(isInWeek(t({ due_date: '2026-10-12' }), '2026-10-05')).toBe(false);
    expect(isInWeek(t({ planned_week: '2026-10-05' }), '2026-10-05')).toBe(true);
  });

  it('ordenar capturas desde la Bandeja', () => {
    expect(organizePatch('hoy', today)).toEqual({ status: 'hoy', due_date: today });
    expect(organizePatch('semana', today)).toEqual({ status: 'pendiente', planned_week: '2026-10-05' });
    expect(organizePatch('despues', today)).toEqual({ status: 'pendiente', due_date: null, planned_week: null });
    expect(organizePatch('delegar', today, '  Pedro ')).toEqual({ status: 'esperando', waiting_on: 'Pedro' });
  });

  it('marcar Hoy fija la fecha de hoy si no tenía o era futura', () => {
    expect(statusPatch('hoy', { due_date: null }, today)).toMatchObject({ status: 'hoy', due_date: today });
    expect(statusPatch('hoy', { due_date: '2026-10-01' }, today)).not.toHaveProperty('due_date');
    expect(statusPatch('completado', { due_date: null }, today).completed_at).not.toBeNull();
    expect(statusPatch('pendiente', { due_date: null }, today).completed_at).toBeNull();
  });

  it('agrupa el trabajo: Hoy, Esperando, Pendientes, Completadas recientes', () => {
    const g = groupWorkTasks(
      [
        t({ id: 'a', status: 'hoy' }),
        t({ id: 'b', status: 'en_curso' }),
        t({ id: 'c', status: 'esperando', waiting_on: 'Proveedor' }),
        t({ id: 'd', due_date: '2026-10-20' }),
        t({ id: 'e', status: 'completado', completed_at: '2026-10-06T12:00:00Z' }),
        t({ id: 'f', status: 'completado', completed_at: '2026-09-01T12:00:00Z' }),
        t({ id: 'g', due_date: '2026-10-02' }),
      ],
      today
    );
    expect(g.hoy.map((x) => x.id)).toEqual(['b', 'g', 'a']); // en curso, atrasada, hoy
    expect(g.esperando.map((x) => x.id)).toEqual(['c']);
    expect(g.pendientes.map((x) => x.id)).toEqual(['d']);
    expect(g.completadas.map((x) => x.id)).toEqual(['e']);
  });
});

describe('prioridades del día', () => {
  it('máximo 3', () => {
    expect(MAX_PRIORITIES).toBe(3);
    expect(nextPosition([])).toBe(1);
    expect(nextPosition([1, 3])).toBe(2);
    expect(nextPosition([1, 2, 3])).toBeNull();
    expect(canAddPriority(2)).toBe(true);
    expect(canAddPriority(3)).toBe(false);
  });

  it('sugiere lo atrasado primero y excluye lo ya elegido', () => {
    const tasks = [
      t({ id: 'hoy', status: 'hoy' }),
      t({ id: 'atrasada', due_date: '2026-10-01' }),
      t({ id: 'curso', status: 'en_curso' }),
      t({ id: 'vence', due_date: today }),
      t({ id: 'futura', due_date: '2026-10-30' }),
      t({ id: 'captura', status: 'inbox' }),
    ];
    expect(suggestPriorities(tasks, today, []).map((x) => x.id)).toEqual(['atrasada', 'curso', 'hoy', 'vence']);
    expect(suggestPriorities(tasks, today, ['atrasada']).map((x) => x.id)).toEqual(['curso', 'hoy', 'vence']);
  });
});
