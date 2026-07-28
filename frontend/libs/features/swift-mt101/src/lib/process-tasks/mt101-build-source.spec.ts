import { describe, expect, it } from 'vitest';
import { Mt101BuildFromTableTaskProvider } from './mt101-build-from-table-task.provider';
import { ProcessTaskFormModel } from '@integration-hub/core/providers';

/**
 * La tabla de origen de MT101_BUILD_FROM_TABLE dejo de estar en {@code preserved} y pasa a ser gobernada por el
 * form (conexion + tabla + columnas, patron DB_WRITE). El resto del objeto {@code source} —scope del lote
 * ({@code processExecutionId}/{@code taskDefinitionId}) y acotado del rebuild ({@code recordIndexIn}/
 * {@code rebuildRunId})— se PRESERVA: exponer la tabla no debe des-acotar un rebuild selectivo.
 */
function task(config: Record<string, unknown>): ProcessTaskFormModel {
  return {
    clientId: 'c', id: null, taskOrder: 10, taskType: 'MT101_BUILD_FROM_TABLE', active: true,
    sourceDefinitionId: null, readerDefinitionId: null, configurationJson: JSON.stringify(config),
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const save = (p: any, draft: any) => JSON.parse(p.toTaskPatch(draft).configurationJson as string);

describe('MT101_BUILD_FROM_TABLE — tabla de origen gobernada por el form', () => {
  it('hidrata la tabla/columnas/conexion del source a campos del draft', () => {
    const p = new Mt101BuildFromTableTaskProvider();
    const draft = p.hydrateDraft(task({
      taskRef: 'bft', connectionRef: 'conn-origen',
      source: { table: 'staging_corregido', payloadColumn: 'payload_json', idColumn: 'id' },
    }));
    expect(draft.sourceTable).toBe('staging_corregido');
    expect(draft.sourceConnectionRef).toBe('conn-origen');
    expect(draft.sourcePayloadColumn).toBe('payload_json');
    expect(draft.sourceIdColumn).toBe('id');
  });

  it('cambiar la tabla desde el form PRESERVA el acotado del rebuild (recordIndexIn/rebuildRunId)', () => {
    const p = new Mt101BuildFromTableTaskProvider();
    const draft = p.hydrateDraft(task({
      taskRef: 'bft',
      source: { table: 'staging_viejo', recordIndexIn: [3, 7, 11], rebuildRunId: 'RUN-9', processExecutionId: 4242 },
    }));

    const saved = save(p, { ...draft, sourceTable: 'staging_nuevo' });

    expect(saved.source.table, 'la tabla nueva no se guardo').toBe('staging_nuevo');
    expect(saved.source.recordIndexIn, 'se des-acoto el rebuild selectivo').toEqual([3, 7, 11]);
    expect(saved.source.rebuildRunId).toBe('RUN-9');
    expect(saved.source.processExecutionId).toBe(4242);
  });

  it('la conexion del origen se emite en el nivel superior (connectionRef)', () => {
    const p = new Mt101BuildFromTableTaskProvider();
    const draft = p.hydrateDraft(task({ taskRef: 'bft', source: { table: 't' } }));

    const saved = save(p, { ...draft, sourceConnectionRef: 'conn-x' });

    expect(saved.connectionRef).toBe('conn-x');
  });

  it('una tarea NUEVA sin source no emite source (el backend lo deriva de la tarea de origen)', () => {
    const p = new Mt101BuildFromTableTaskProvider();
    const saved = save(p, { ...p.createDraft(), taskRef: 'nueva' });
    expect(saved.source, 'una tarea nueva no debe forzar una tabla de origen').toBeUndefined();
    expect(saved.connectionRef).toBeUndefined();
  });

  it('vaciar la tabla pero con rebuild acotado: source sobrevive por las claves preservadas', () => {
    const p = new Mt101BuildFromTableTaskProvider();
    const draft = p.hydrateDraft(task({ taskRef: 'bft', source: { table: 't', recordIndexIn: [1, 2] } }));

    const saved = save(p, { ...draft, sourceTable: '' });

    expect(saved.source.table, 'la tabla vaciada no debe persistir').toBeUndefined();
    expect(saved.source.recordIndexIn, 'el acotado del rebuild debe sobrevivir').toEqual([1, 2]);
  });
});
