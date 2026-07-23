import { describe, expect, it } from 'vitest';
import { DB_WRITE_DEFAULT_PLATFORM_TABLE, DbWriteTaskProvider } from './db-write-task.provider';
import { ProcessTaskFormModel } from '../../../tasks/process-task.models';

const baseTask: ProcessTaskFormModel = {
  clientId: 'c-1', id: null, taskOrder: 1, taskType: 'DB_WRITE', active: true,
  sourceDefinitionId: null, readerDefinitionId: null, configurationJson: '{}',
};

describe('DbWriteTaskProvider', () => {
  it('declares DB_WRITE with workspace layout', () => {
    const p = new DbWriteTaskProvider();
    expect(p.descriptor.type).toBe('DB_WRITE');
    expect(p.descriptor.modalLayout).toBe('workspace');
  });

  it('createDraft arranca en el datasource de la plataforma con la tabla de staging por defecto', () => {
    // 011: una tarea nueva usa connectionRef vacio (datasource de la plataforma) -> targetTable debe venir
    // pre-rellenada. Antes quedaba vacia: el prefill solo existia en handleConnectionChange del form, asi que
    // solo aparecia si el usuario tocaba el selector de conexion.
    const draft = new DbWriteTaskProvider().createDraft();
    expect(draft.executionMode).toBe('batch');
    expect(draft.connectionRef).toBe('');
    expect(draft.targetTable).toBe(DB_WRITE_DEFAULT_PLATFORM_TABLE);
    expect(draft.targetSchema).toBe('');
    expect(draft.mode).toBe('insert');
  });

  it('el default sobrevive el round-trip createDraft -> toTaskPatch -> hydrateDraft', () => {
    const p = new DbWriteTaskProvider();
    const patch = p.toTaskPatch({ ...p.createDraft(), taskRef: 'w1' });
    const config = JSON.parse(patch.configurationJson as string);
    // Sin schema, targetTable se persiste sin calificar.
    expect(config.targetTable).toBe(DB_WRITE_DEFAULT_PLATFORM_TABLE);

    const rehydrated = p.hydrateDraft({ ...baseTask, configurationJson: patch.configurationJson as string });
    expect(rehydrated.targetTable).toBe(DB_WRITE_DEFAULT_PLATFORM_TABLE);
    expect(rehydrated.targetSchema).toBe('');
  });

  it('una tabla calificada schema.tabla se parte al hidratar', () => {
    const p = new DbWriteTaskProvider();
    const draft = p.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({ taskRef: 'w1', targetTable: 'ventas.pedido' }),
    });
    expect(draft.targetSchema).toBe('ventas');
    expect(draft.targetTable).toBe('pedido');
  });
});
