import { describe, expect, it } from 'vitest';
import { createTaskForm, toProcessTaskFormModel } from './process.models';

/**
 * Regresion: el clientId de una tarea NUEVA (contador) colisionaba con el `task-<id de BD>` de una tarea cargada
 * cuando el contador alcanzaba ese id -> dos nodos con el mismo clientId -> el flow @foblex tiraba
 * "Node already exists: task-3". Namespaces separados: nuevas = `task-new-N`, cargadas = `task-<id>`.
 */
describe('process.models clientId — sin colision nueva vs cargada', () => {
  it('una tarea cargada usa task-<id de BD>', () => {
    const loaded = toProcessTaskFormModel({ id: 3, taskOrder: 1, taskType: 'FILE_READ', active: true, configurationJson: '{}' } as any);
    expect(loaded.clientId).toBe('task-3');
  });

  it('las tareas nuevas usan el namespace task-new- (no pueden igualar task-<numero>)', () => {
    const news = [createTaskForm(), createTaskForm(), createTaskForm(), createTaskForm(), createTaskForm()];
    expect(news.every((task) => task.clientId.startsWith('task-new-'))).toBe(true);
    // Ninguna nueva colisiona con un task-<id de BD> (p.ej. task-3), aunque el contador pase por 3.
    expect(news.every((task) => /^task-new-\d+$/.test(task.clientId))).toBe(true);
    expect(news.some((task) => task.clientId === 'task-3')).toBe(false);
  });

  it('los clientId de tareas nuevas son unicos entre si', () => {
    const ids = [createTaskForm(), createTaskForm(), createTaskForm()].map((task) => task.clientId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
