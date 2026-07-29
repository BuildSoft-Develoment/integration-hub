import { describe, expect, it } from 'vitest';
import { createTaskForm, nextFreeTaskRef, toProcessTaskFormModel } from './process.models';

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

/**
 * Misma familia que la colision de clientId de arriba, pero en el identificador de CABLEADO.
 * `input.sourceTaskRef` apunta al taskRef, y en el money-path `resolvesPayTaskRef` nombra a que
 * MT101_PAY concilia un MT101_STATUS: duplicado, la referencia se resuelve por "el primero que
 * coincida" — el pipeline armado no es el dibujado, y se concilia contra un pago que no es.
 */
describe('nextFreeTaskRef — el taskRef autogenerado no colisiona', () => {
  const conRef = (ref: string) =>
    ({ clientId: 'c', id: null, taskOrder: 1, taskType: 'FILE_READ', active: true,
       sourceDefinitionId: null, readerDefinitionId: null,
       configurationJson: JSON.stringify({ taskRef: ref }) }) as any;

  it('empieza en 1 con el proceso vacio', () => {
    expect(nextFreeTaskRef('task', [])).toBe('task-1');
  });

  it('saltea los nombres en uso en vez de contar tareas', () => {
    // El bug: `task-${tasks.length + 1}`. Con task-1 y task-3 presentes, length+1 daba task-3 -> colision.
    expect(nextFreeTaskRef('task', [conRef('task-1'), conRef('task-3')])).toBe('task-2');
  });

  it('el hueco tras borrar la del medio no reutiliza un nombre vivo', () => {
    // Agregar 3, borrar la del medio, agregar otra: length+1 volvia a dar task-3, que seguia existiendo.
    expect(nextFreeTaskRef('task', [conRef('task-1'), conRef('task-3')])).not.toBe('task-3');
  });

  it('ignora las tareas sin taskRef y las de configuracion rota', () => {
    const sinRef = { ...conRef('x'), configurationJson: '{}' } as any;
    const rota = { ...conRef('x'), configurationJson: '{roto' } as any;
    expect(nextFreeTaskRef('task', [sinRef, rota])).toBe('task-1');
  });

  it('respeta nombres puestos a mano por el operador', () => {
    expect(nextFreeTaskRef('task', [conRef('leer-archivo'), conRef('task-1')])).toBe('task-2');
  });
});
