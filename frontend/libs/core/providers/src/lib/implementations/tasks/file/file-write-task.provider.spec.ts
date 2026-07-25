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

  // --- ADR-004: fuente de datos DERIVADA (sin tarea de origen = tabla directa; con tarea = records) ---

  it('sin tarea de origen (default) -> tabla directa (input.sourceOutput=table + cursor.orderBy)', () => {
    const config = JSON.parse(provider.toTaskPatch(provider.createDraft()).configurationJson as string);
    expect(config.input.source).toBe('task-output');
    expect(config.input.sourceOutput).toBe('table');
    expect(config.input.cursor.orderBy).toBe('id');
  });

  it('con tarea de origen -> records (input con sourceTaskRef, no tabla standalone)', () => {
    const draft = provider.createDraft();
    draft.input = { source: 'task-output', sourceTaskRef: 'read1', sourceOutput: 'records' } as any;
    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(config.input.sourceTaskRef).toBe('read1');
    expect(config.input.sourceOutput).toBe('records');
  });

  it('modo tabla: serializa table/connectionRef/cursor/payloadColumn/batchSize desde tableSource', () => {
    const draft = provider.createDraft();
    draft.tableSource = { table: 'staging_record', connectionRef: 'bank-db', orderBy: 'record_id', payloadColumn: 'payload_json', batchSize: '2000', filters: [] };

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
    draft.tableSource = { table: 't', connectionRef: '', orderBy: '', payloadColumn: '', batchSize: '', filters: [] };

    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);

    expect(config.input.cursor.orderBy).toBe('id');
    expect(config.input.connectionRef).toBeUndefined(); // vacio = datasource plataforma, no se emite
  });

  it('round-trips el modo tabla (el modo se deriva de la ausencia de sourceTaskRef)', () => {
    const draft = provider.createDraft();
    draft.tableSource = { table: 'staging_record', connectionRef: '', orderBy: 'id', payloadColumn: 'payload_json', batchSize: '', filters: [] };

    const rehydrated = roundTrip(draft);

    // Sin sourceTaskRef en el input rehidratado = modo tabla (derivado).
    expect(rehydrated.input?.sourceTaskRef).toBeUndefined();
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

    // Rehidratado conserva la tarea de origen (records-derived), no pasa a tabla standalone.
    const rehydrated = provider.hydrateDraft({ taskType: 'FILE_WRITE', configurationJson: JSON.stringify(config) } as any);
    expect(rehydrated.input?.sourceTaskRef).toBe('dbwrite1');
  });

  it('modo records: preserva un sourceOutput no-default (errors) de una config legacy (backward-compat)', () => {
    const draft = provider.createDraft();
    // Ya no hay selector de salida de origen (el detalle usa el default de la tarea); pero una config guardada con
    // un sourceOutput no-default debe round-trippear sin clobbering (no se pisa 'errors' -> 'records').
    draft.input = { source: 'task-output', sourceTaskRef: 'read1', sourceOutput: 'errors' } as any;

    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(config.input).toMatchObject({ source: 'task-output', sourceTaskRef: 'read1', sourceOutput: 'errors' });
    // 'errors' no es un stream de tabla -> no se inyecta cursor keyset (solo 'table' lo lleva).
    expect(config.input.cursor).toBeUndefined();

    const rehydrated = provider.hydrateDraft({ taskType: 'FILE_WRITE', configurationJson: JSON.stringify(config) } as any);
    expect(rehydrated.input?.sourceTaskRef).toBe('read1'); // records-derived = conserva la tarea de origen
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
it('modo tabla directa: conserva input.filters (si no, el export vuelca la tabla COMPLETA)', () => {
    // La rama de tabla directa RECONSTRUYE input entero, pisando lo que emitio withRuntime. filters es el
    // predicado que acota que filas se exportan (FileWriteTaskProvider:172 lo pasa a count y a readBatch);
    // tipicamente acota a la corrida actual. Perderlo convierte el export incremental en un volcado total.
    const task: any = { taskType: 'FILE_WRITE', configurationJson: JSON.stringify({
      taskRef: 'fw', executionMode: 'once', format: 'CSV',
      layout: { detail: { columns: [{ field: 'id' }] } },
      input: { source: 'task-output', sourceOutput: 'table', table: 'mt101_archive',
        cursor: { orderBy: 'id' }, filters: { process_execution_id: '' } },
    }) };

    const saved = JSON.parse(provider.toTaskPatch(provider.hydrateDraft(task)).configurationJson as string);

    expect(saved.input.filters, 'se perdio el filtro: el export pasa a volcar la tabla entera')
      .toEqual({ process_execution_id: '' });
    expect(saved.input.table).toBe('mt101_archive');
  });

  it('modo tabla: el filtro se hidrata como filas y se re-cierra a mapa (valor = variable de metadata)', () => {
    // El backend sustituye ${_processExecutionId}; el form lo edita como fila {columna, valor}.
    const task: any = { taskType: 'FILE_WRITE', configurationJson: JSON.stringify({
      taskRef: 'fw', executionMode: 'once', format: 'CSV',
      layout: { detail: { columns: [{ field: 'id' }] } },
      input: { source: 'task-output', sourceOutput: 'table', table: 'mt101_archive', cursor: { orderBy: 'id' },
        filters: { process_execution_id: '${_processExecutionId}', status: 'SENT' } },
    }) };

    const draft = provider.hydrateDraft(task);
    expect(draft.tableSource.filters).toEqual([
      { column: 'process_execution_id', value: '${_processExecutionId}' },
      { column: 'status', value: 'SENT' },
    ]);

    const saved = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(saved.input.filters).toEqual({ process_execution_id: '${_processExecutionId}', status: 'SENT' });
  });

  it('modo tabla: una fila de filtro sin columna NO se serializa (pero sobrevive en el draft para editarla)', () => {
    const draft = provider.createDraft();
    draft.tableSource = { table: 't', connectionRef: '', orderBy: 'id', payloadColumn: '', batchSize: '',
      filters: [{ column: 'status', value: 'SENT' }, { column: '', value: '' }] };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patch: any = provider.toTaskPatch(draft);
    const saved = JSON.parse(patch.configurationJson as string);

    expect(saved.input.filters, 'solo la fila con columna se cierra al mapa').toEqual({ status: 'SENT' });
    // la fila vacia sobrevive en el round-trip del draft (para poder tipearla)
    const rehydrated = provider.hydrateDraft({ taskType: 'FILE_WRITE', configurationJson: patch.configurationJson } as any);
    expect(rehydrated.tableSource.filters).toEqual([{ column: 'status', value: 'SENT' }]);
  });

  it('modo tabla: sin filas de filtro no se emite input.filters', () => {
    const draft = provider.createDraft();
    draft.tableSource = { table: 't', connectionRef: '', orderBy: 'id', payloadColumn: '', batchSize: '', filters: [] };
    const saved = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(saved.input.filters).toBeUndefined();
  });

  it('conserva source y connectionRef de nivel superior (eslabones del fallback del backend)', () => {
    const task: any = { taskType: 'FILE_WRITE', configurationJson: JSON.stringify({
      taskRef: 'fw', executionMode: 'once', format: 'CSV',
      layout: { detail: { columns: [{ field: 'id' }] } },
      connectionRef: 'conn-reportes',
      source: { table: 'mt101_archive', idColumn: 'id', payloadColumn: 'raw_payload' },
      input: { source: 'task-output', sourceOutput: 'table', cursor: { orderBy: 'id' } },
    }) };

    const saved = JSON.parse(provider.toTaskPatch(provider.hydrateDraft(task)).configurationJson as string);

    expect(saved.connectionRef, 'sin connectionRef la lectura cae al datasource de la plataforma')
      .toBe('conn-reportes');
    expect(saved.source, 'sin source la tabla cae al default y se exporta OTRA tabla')
      .toEqual({ table: 'mt101_archive', idColumn: 'id', payloadColumn: 'raw_payload' });
  });
});
