import { describe, expect, it } from 'vitest';
import { FileWriteTaskProvider } from './file-write-task.provider';

/**
 * ADR-016: contrato de serializacion del form FILE_WRITE. El draft hace round-trip por el
 * configurationJson en cada cambio (toTaskPatch -> hydrateDraft), asi que la serializacion NO debe
 * perder estado en edicion.
 */
describe('FileWriteTaskProvider', () => {
  const provider = new FileWriteTaskProvider();

  const roundTrip = (draft: ReturnType<FileWriteTaskProvider['createDraft']>) => {
    const patch = provider.toTaskPatch(draft);
    const task: any = { taskType: 'FILE_WRITE', configurationJson: patch.configurationJson };
    return provider.hydrateDraft(task);
  };

  it('preserva una columna recien agregada con field vacio (regresion: "Agregar" no hacia nada)', () => {
    const draft = provider.createDraft();
    // addColumn() agrega una columna vacia para que el usuario la llene.
    draft.columns = [{ field: 'ref' }, { field: '' }];

    const rehydrated = roundTrip(draft);

    // Antes se filtraba la columna vacia al serializar -> desaparecia en el round-trip -> "Agregar" no hacia nada.
    expect(rehydrated.columns.length).toBe(2);
    expect(rehydrated.columns[1].field).toBe('');
  });

  it('preserva una celda de cabecera cambiada a metadata sin valor (regresion: se filtraba)', () => {
    const draft = provider.createDraft();
    // El usuario cambio el kind a 'metadata' pero aun no eligio el valor concreto.
    draft.header = [{ kind: 'metadata' }];

    const rehydrated = roundTrip(draft);

    expect(rehydrated.header.length).toBe(1);
    expect(rehydrated.header[0].kind).toBe('metadata');
    expect(rehydrated.header[0].metadata).toBe('_processExecutionId');
  });

  it('round-trips type/format/rounding de una columna NUMBER', () => {
    const draft = provider.createDraft();
    draft.columns = [{ field: 'monto', type: 'NUMBER', format: '0.00', rounding: 'HALF_EVEN' }];

    const rehydrated = roundTrip(draft);

    expect(rehydrated.columns[0]).toMatchObject({ field: 'monto', type: 'NUMBER', format: '0.00', rounding: 'HALF_EVEN' });
  });

  // --- ADR-004: fuente de datos (records vs table) ---

  it('modo records (default) no escribe un input de tabla', () => {
    const config = JSON.parse(provider.toTaskPatch(provider.createDraft()).configurationJson as string);
    expect(config.input?.sourceOutput).not.toBe('table');
  });

  it('serializa el modo tabla a input con source=task-output, sourceOutput=table y cursor.orderBy', () => {
    const draft = provider.createDraft();
    draft.sourceMode = 'table';
    draft.tableSource = { table: 'staging_record', connectionRef: 'bank-db', orderBy: 'record_id', payloadColumn: 'payload_json', batchSize: '2000' };

    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);

    // El motor (TaskInputResolver) exige source=task-output; FILE_WRITE lee sourceOutput=table + cursor.orderBy.
    expect(config.input).toMatchObject({
      source: 'task-output',
      sourceOutput: 'table',
      table: 'staging_record',
      connectionRef: 'bank-db',
      cursor: { orderBy: 'record_id' },
      payloadColumn: 'payload_json',
      batchSize: 2000,
    });
  });

  it('modo tabla: cursor.orderBy default a "id" cuando esta vacio', () => {
    const draft = provider.createDraft();
    draft.sourceMode = 'table';
    draft.tableSource = { table: 't', connectionRef: '', orderBy: '', payloadColumn: '', batchSize: '' };

    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);

    expect(config.input.cursor.orderBy).toBe('id');
    expect(config.input.connectionRef).toBeUndefined(); // vacio = datasource plataforma, no se emite
  });

  it('round-trips el modo tabla (sourceMode + tableSource)', () => {
    const draft = provider.createDraft();
    draft.sourceMode = 'table';
    draft.tableSource = { table: 'staging_record', connectionRef: '', orderBy: 'id', payloadColumn: 'payload_json', batchSize: '' };

    const rehydrated = roundTrip(draft);

    expect(rehydrated.sourceMode).toBe('table');
    expect(rehydrated.tableSource).toMatchObject({ table: 'staging_record', orderBy: 'id', payloadColumn: 'payload_json' });
  });

  it('preserva "X produce una tabla" (DB_WRITE -> FILE_WRITE): records + sourceTaskRef + cursor.orderBy default', () => {
    const draft = provider.createDraft();
    // El runtime panel eligio DB_WRITE como origen -> sourceOutput='table' CON sourceTaskRef (no standalone).
    draft.input = { source: 'task-output', sourceTaskRef: 'dbwrite1', sourceOutput: 'table' } as any;

    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);

    expect(config.input.sourceTaskRef).toBe('dbwrite1'); // NO se pierde la tarea de origen
    expect(config.input.sourceOutput).toBe('table');
    expect(config.input.cursor.orderBy).toBe('id'); // el backend exige cursor.orderBy (keyset)

    // Y al re-hidratar sigue en modo records (no se cambia a la tabla standalone, que ocultaria el selector).
    const rehydrated = provider.hydrateDraft({ taskType: 'FILE_WRITE', configurationJson: JSON.stringify(config) } as any);
    expect(rehydrated.sourceMode).toBe('records');
  });

  it('round-trips align/pad en una celda de cabecera TXT (simetria con el detalle)', () => {
    const draft = provider.createDraft();
    draft.format = 'TXT';
    draft.columns = [{ field: 'a', length: '10' }];
    draft.header = [{ kind: 'value', value: 'H', length: '10', align: 'right', pad: '0' }];

    const rehydrated = roundTrip(draft);

    expect(rehydrated.header[0]).toMatchObject({ kind: 'value', length: '10', align: 'right', pad: '0' });
  });
});
