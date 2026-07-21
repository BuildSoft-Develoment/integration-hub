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

  it('round-trips una columna con expresion (modo fx), incluso vacia', () => {
    const draft = provider.createDraft();
    draft.columns = [
      { field: 'neto', type: 'NUMBER', format: '0.00', expression: 'bruto - comision' },
      { field: 'x', expression: '' }, // fx activado sin formula todavia: debe sobrevivir el round-trip (si no, el toggle se apaga solo)
    ];

    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(config.layout.detail.columns[0]).toMatchObject({ field: 'neto', type: 'NUMBER', format: '0.00', expression: 'bruto - comision' });
    expect(config.layout.detail.columns[1].expression).toBe(''); // presente-pero-vacia se emite

    const rehydrated = roundTrip(draft);
    expect(rehydrated.columns[0].expression).toBe('bruto - comision');
    expect(rehydrated.columns[1].expression).toBe(''); // fx sigue activo tras el round-trip
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

  it('modo records: preserva un sourceOutput no-default (errors) elegido en el selector de salida de origen', () => {
    const draft = provider.createDraft();
    // El runtime panel eligio la tarea de origen; el selector de salida cambio records -> errors.
    draft.input = { source: 'task-output', sourceTaskRef: 'read1', sourceOutput: 'errors' } as any;

    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(config.input).toMatchObject({ source: 'task-output', sourceTaskRef: 'read1', sourceOutput: 'errors' });
    // 'errors' no es un stream de tabla -> no se inyecta cursor keyset (solo 'table' lo lleva).
    expect(config.input.cursor).toBeUndefined();

    const rehydrated = provider.hydrateDraft({ taskType: 'FILE_WRITE', configurationJson: JSON.stringify(config) } as any);
    expect(rehydrated.sourceMode).toBe('records');
    expect(rehydrated.input?.sourceOutput).toBe('errors');
  });

  it('round-trips una celda binding (summary/out de una tarea previa) en header/trailer', () => {
    const draft = provider.createDraft();
    draft.trailer = [{ kind: 'binding', sourceOutput: 'summary', sourceTaskRef: 'sp1', sourceKey: 'processedCount' }];

    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    // El backend (resolveBinding) lee taskOutputs[sp1.summary][processedCount].
    expect(config.layout.trailer[0]).toMatchObject({ sourceOutput: 'summary', sourceTaskRef: 'sp1', sourceKey: 'processedCount' });

    const rehydrated = roundTrip(draft);
    expect(rehydrated.trailer[0]).toMatchObject({ kind: 'binding', sourceOutput: 'summary', sourceTaskRef: 'sp1', sourceKey: 'processedCount' });
  });

  it('round-trips align/pad en una celda de cabecera TXT (simetria con el detalle)', () => {
    const draft = provider.createDraft();
    draft.format = 'TXT';
    draft.columns = [{ field: 'a', length: '10' }];
    draft.header = [{ kind: 'value', value: 'H', length: '10', align: 'right', pad: '0' }];

    const rehydrated = roundTrip(draft);

    expect(rehydrated.header[0]).toMatchObject({ kind: 'value', length: '10', align: 'right', pad: '0' });
  });

  // --- opciones de formato (CSV quoteStrategy, XLSX) ---

  it('serializa quoteStrategy=ALWAYS en CSV y omite el default REQUIRED', () => {
    const always = { ...provider.createDraft(), columns: [{ field: 'a' }], quoteStrategy: 'ALWAYS' as const };
    const config = JSON.parse(provider.toTaskPatch(always).configurationJson as string);
    expect(config.layout.detail.quoteStrategy).toBe('ALWAYS');

    const req = { ...provider.createDraft(), columns: [{ field: 'a' }] }; // REQUIRED default
    const configReq = JSON.parse(provider.toTaskPatch(req).configurationJson as string);
    expect(configReq.layout.detail.quoteStrategy).toBeUndefined();
  });

  it('serializa la config XLSX (solo no-defaults) y round-trip', () => {
    const draft = provider.createDraft();
    draft.format = 'XLSX';
    draft.columns = [{ field: 'monto', type: 'NUMBER', format: '0.00' }];
    draft.xlsx = { sheetName: 'Reporte', headerStyle: 'PLAIN', freezeHeader: false, autoFilter: true, autoSizeColumns: true };

    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(config.format).toBe('XLSX');
    expect(config.xlsx).toEqual({ sheetName: 'Reporte', headerStyle: 'PLAIN', freezeHeader: false, autoFilter: true, autoSizeColumns: true });

    const rehydrated = roundTrip(draft);
    expect(rehydrated.format).toBe('XLSX');
    expect(rehydrated.xlsx).toEqual(draft.xlsx);
  });

  it('XLSX con defaults no emite bloque xlsx', () => {
    const draft = { ...provider.createDraft(), format: 'XLSX' as const, columns: [{ field: 'a' }] };
    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(config.xlsx).toBeUndefined();
    // y al re-hidratar vuelve a los defaults (sheetName vacio, BOLD, freeze true, filtros off)
    const rehydrated = roundTrip(draft);
    expect(rehydrated.xlsx).toEqual({ sheetName: '', headerStyle: 'BOLD', freezeHeader: true, autoFilter: false, autoSizeColumns: false });
  });
});
