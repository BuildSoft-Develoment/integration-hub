// @trace ADR-016 (procesos: contrato configuration_json de la tarea FILE_WRITE)
import { Injectable } from '@angular/core';
import { ProcessTaskRuntimeDraft } from '../../../tasks/process-task-binding.models';
import { ProcessTaskProvider } from '../../../tasks/process-task-provider.abstract';
import { ProcessTaskFormModel } from '../../../tasks/process-task.models';

export type FileWriteFormat = 'CSV' | 'TXT' | 'XLSX';
export type FileWriteAlign = 'left' | 'right';
export type FileWriteColumnType = 'STRING' | 'NUMBER' | 'DATE';
// Modos de redondeo (RoundingMode de Java) que ofrece la UI; el backend acepta cualquier nombre valido, por eso
// el campo es passthrough (string): un modo agregado o hand-edited se preserva en el round-trip, no se colapsa.
export type FileWriteRounding = 'HALF_UP' | 'HALF_EVEN' | 'DOWN';
// 'binding': celda ligada a un output AGREGADO (summary/out) de una tarea previa. El backend
// (FileWriteTaskProvider.resolveBinding) lo resuelve leyendo taskOutputs[sourceTaskRef.sourceOutput][sourceKey].
export type FileWriteCellKind = 'value' | 'metadata' | 'aggregate' | 'binding';
export type FileWriteBindingOutput = 'summary' | 'out';
// CSV: estrategia de comillas de FastCSV. REQUIRED (RFC-4180, default) solo entrecomilla cuando hace falta;
// ALWAYS entrecomilla todos los campos.
export type FileWriteQuoteStrategy = 'REQUIRED' | 'ALWAYS';

/** Opciones especificas del formato XLSX (POI). Se serializan bajo `xlsx`. */
export interface FileWriteXlsxDraft {
  sheetName: string;
  headerStyle: 'BOLD' | 'PLAIN';
  freezeHeader: boolean;
  autoFilter: boolean;
  autoSizeColumns: boolean;
}

export interface FileWriteColumnDraft {
  field: string;
  // Expresion JEXL por registro (ADR-004): si esta presente, el valor de la columna se COMPUTA (backend
  // FileWriteExpressionEvaluator) en vez de leer `field` directo. `field` sigue siendo el nombre de salida.
  // El type/format/rounding se aplican encima del resultado. '' (presente-vacia) = modo 'fx' activo sin formula.
  expression?: string;
  type?: FileWriteColumnType;
  format?: string;
  rounding?: FileWriteRounding | (string & {});
  length?: string;
  align?: FileWriteAlign;
  pad?: string;
}

export interface FileWriteCellDraft {
  kind: FileWriteCellKind;
  value?: string;
  metadata?: string;
  aggregate?: 'count' | 'sum';
  field?: string;
  // Celda 'binding' (summary/out de una tarea previa): sourceOutput = kind del output; sourceTaskRef = tarea
  // productora; sourceKey = campo dentro del Map de ese output.
  sourceOutput?: FileWriteBindingOutput;
  sourceTaskRef?: string;
  sourceKey?: string;
  length?: string;
  align?: FileWriteAlign;
  pad?: string;
}

// ADR-016 / ADR-004: el modo de origen se DERIVA (no hay toggle, paridad con DB_WRITE):
//  - con tarea de origen (input.sourceTaskRef, elegida en el runtime panel) -> records: la salida de una tarea
//    previa (X -> FILE_WRITE).
//  - SIN tarea de origen -> tabla DIRECTA (input.sourceOutput='table', paginacion keyset; escala a >1M).
/** Un predicado de igualdad columna = valor. El valor puede ser un literal o una variable de metadata. */
export interface FileWriteFilterDraft {
  column: string;
  value: string;
}

// Config de la tabla directa (se serializa bajo `input` cuando no hay tarea de origen):
export interface FileWriteTableSourceDraft {
  table: string;
  connectionRef: string;
  orderBy: string;
  payloadColumn: string;
  batchSize: string;
  /**
   * Predicado que acota QUE filas se exportan (mapa columna = valor, AND). El backend lo pasa a `count` y a
   * `readBatch` ({@code FileWriteTaskProvider.resolveFilters}) y sustituye {@code ${_processExecutionId}} y
   * {@code ${_taskDefinitionId}}; tipicamente {@code {process_execution_id: '${_processExecutionId}'}} para
   * exportar solo la corrida actual. Se edita como lista de filas; se serializa a mapa en {@code toTaskPatch}.
   * Sin filtro, el export vuelca la tabla COMPLETA.
   */
  filters: FileWriteFilterDraft[];
}

/** Variables de metadata que el backend sustituye en el valor de un filtro (FileWriteTaskProvider.resolveFilterValue). */
export const FILE_WRITE_FILTER_METADATA_VARS: readonly string[] = ['${_processExecutionId}', '${_taskDefinitionId}'];

export type FileWriteTxtMode = 'fixed-length' | 'delimited';

export interface FileWriteTaskDraft extends ProcessTaskRuntimeDraft {
  format: FileWriteFormat;
  encoding: string;
  lineEnding: 'LF' | 'CRLF';
  delimiter: string;
  quoteStrategy: FileWriteQuoteStrategy;
  /** Modo del formato TXT (espejo de los readers): ancho fijo (length/align/pad) o delimitado (join por `delimiter`). */
  txtMode: FileWriteTxtMode;
  xlsx: FileWriteXlsxDraft;
  columns: FileWriteColumnDraft[];
  header: FileWriteCellDraft[];
  trailer: FileWriteCellDraft[];
  archiveNameTemplate: string;
  tableSource: FileWriteTableSourceDraft;
  /** Claves de nivel superior que el backend lee y ningun campo del form escribe (ver FILE_WRITE_PRESERVED_KEYS). */
  preserved: Record<string, unknown>;
}

/**
 * - `source`: mapa {table, idColumn, payloadColumn} que el backend usa como SEGUNDO eslabon del fallback de
 *   tabla/orderBy ({@code FileWriteTaskProvider:158-169}). Al perderlo, una config que solo lo tenia ahi cae a
 *   la tabla por defecto y exporta OTRA tabla.
 * - `connectionRef`: ULTIMO eslabon del fallback del datasource; sin el, la lectura cae al datasource de la
 *   plataforma.
 */
const FILE_WRITE_PRESERVED_KEYS = ['source', 'connectionRef'] as const;

@Injectable()
export class FileWriteTaskProvider extends ProcessTaskProvider<FileWriteTaskDraft> {
  readonly descriptor = {
    type: 'FILE_WRITE' as const,
    labelKey: 'processTask.FILE_WRITE',
    descriptionKey: 'processTaskDescription.FILE_WRITE',
    modalLayout: 'workspace' as const,
  };

  createDraft(): FileWriteTaskDraft {
    return {
      taskRef: '',
      executionMode: 'once',
      format: 'CSV',
      encoding: 'UTF-8',
      lineEnding: 'LF',
      delimiter: ',',
      quoteStrategy: 'REQUIRED',
      txtMode: 'fixed-length',
      xlsx: this.defaultXlsx(),
      columns: [],
      header: [],
      trailer: [],
      archiveNameTemplate: '',
      tableSource: this.defaultTableSource(),
      preserved: {},
    };
  }

  private defaultTableSource(): FileWriteTableSourceDraft {
    return { table: '', connectionRef: '', orderBy: 'id', payloadColumn: '', batchSize: '', filters: [] };
  }

  private defaultXlsx(): FileWriteXlsxDraft {
    return { sheetName: '', headerStyle: 'BOLD', freezeHeader: true, autoFilter: false, autoSizeColumns: false };
  }

  hydrateDraft(task: ProcessTaskFormModel): FileWriteTaskDraft {
    const config: any = this.parseJson(task.configurationJson);
    const layout = config.layout && typeof config.layout === 'object' ? config.layout : {};
    const detail = layout.detail && typeof layout.detail === 'object' ? layout.detail : {};
    return {
      ...this.hydrateRuntime(task, 'once'),
      format: this.normalizeFormat(config.format),
      encoding: String(config.encoding || 'UTF-8'),
      lineEnding: String(detail.lineEnding || 'LF').toUpperCase() === 'CRLF' ? 'CRLF' : 'LF',
      delimiter: String(detail.delimiter || ','),
      quoteStrategy: String(detail.quoteStrategy || 'REQUIRED').toUpperCase() === 'ALWAYS' ? 'ALWAYS' : 'REQUIRED',
      // TXT: default fixed-length (compatibilidad con lo ya guardado, que no tenia `mode`).
      txtMode: String(detail.mode || 'fixed-length').toLowerCase() === 'delimited' ? 'delimited' : 'fixed-length',
      xlsx: this.hydrateXlsx(config.xlsx),
      columns: this.hydrateColumns(detail.columns),
      header: this.hydrateCells(layout.header),
      trailer: this.hydrateCells(layout.trailer),
      archiveNameTemplate: String(config.archiveNameTemplate || ''),
      ...this.hydrateSource(config.input),
      preserved: this.preserveKeys(config, FILE_WRITE_PRESERVED_KEYS),
    };
  }

  private hydrateXlsx(raw: unknown): FileWriteXlsxDraft {
    const xlsx = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as any) : {};
    const d = this.defaultXlsx();
    return {
      sheetName: String(xlsx.sheetName || ''),
      headerStyle: String(xlsx.headerStyle || 'BOLD').toUpperCase() === 'PLAIN' ? 'PLAIN' : 'BOLD',
      freezeHeader: xlsx.freezeHeader != null ? xlsx.freezeHeader !== false && xlsx.freezeHeader !== 'false' : d.freezeHeader,
      autoFilter: xlsx.autoFilter === true || xlsx.autoFilter === 'true',
      autoSizeColumns: xlsx.autoSizeColumns === true || xlsx.autoSizeColumns === 'true',
    };
  }

  // Hidrata la config de tabla directa del bloque `input` crudo (hydrateRuntime solo conserva input si hay
  // sourceTaskRef, y no arrastra cursor/payloadColumn; la tabla directa se lee aqui). El MODO ya no se guarda:
  // se deriva de la presencia de sourceTaskRef (con tarea = records; sin tarea = tabla directa).
  private hydrateSource(rawInput: unknown): Pick<FileWriteTaskDraft, 'tableSource'> {
    const input = rawInput && typeof rawInput === 'object' && !Array.isArray(rawInput) ? (rawInput as any) : {};
    const cursor = input.cursor && typeof input.cursor === 'object' ? input.cursor : {};
    return {
      tableSource: {
        table: String(input.table || ''),
        connectionRef: String(input.connectionRef || ''),
        orderBy: String(cursor.orderBy || 'id'),
        payloadColumn: String(input.payloadColumn || ''),
        batchSize: input.batchSize != null && String(input.batchSize).trim() ? String(input.batchSize) : '',
        // Se guarda como LISTA de filas {columna, valor} para que una fila recien agregada (columna vacia)
        // sobreviva el round-trip por configurationJson y se pueda tipear (mismo patron que columns/rules). El
        // backend acepta la lista y tambien el mapa legacy (configs viejas), que se abre a filas al hidratar.
        filters: this.hydrateFilters(input.filters),
      },
    };
  }

  private hydrateFilters(raw: unknown): FileWriteFilterDraft[] {
    if (Array.isArray(raw)) {
      return raw
        .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
        .map((row) => ({ column: String(row['column'] ?? ''), value: String(row['value'] ?? '') }));
    }
    if (raw && typeof raw === 'object') {
      return Object.entries(raw as Record<string, unknown>).map(([column, value]) => ({
        column, value: value == null ? '' : String(value),
      }));
    }
    return [];
  }

  toTaskPatch(draft: FileWriteTaskDraft): Partial<ProcessTaskFormModel> {
    const detail: any = {
      // NO filtrar columnas con field vacio: el draft hace round-trip por el configurationJson en cada cambio,
      // y filtrar aqui borraria la columna recien agregada (nace vacia para llenar) antes de poder editarla
      // ("Agregar" no hacia nada). El backend (CsvWriter/TxtWriter) ya ignora columnas con field en blanco al escribir.
      columns: (draft.columns || []).map((column) => this.columnToConfig(column, draft.format)),
    };
    if (draft.format === 'CSV') {
      detail.delimiter = draft.delimiter || ',';
      // quoteStrategy solo se emite si difiere del default backend (REQUIRED), para no ensuciar la config.
      if (draft.quoteStrategy === 'ALWAYS') {
        detail.quoteStrategy = 'ALWAYS';
      }
    }
    // TXT delimitado: emite mode + delimiter. El modo fixed-length es el default del backend, no se serializa.
    if (draft.format === 'TXT' && draft.txtMode === 'delimited') {
      detail.mode = 'delimited';
      detail.delimiter = draft.delimiter || '|';
    }
    if (draft.lineEnding === 'CRLF') {
      detail.lineEnding = 'CRLF';
    }
    const layout: any = { detail };
    const header = (draft.header || []).map((cell) => this.cellToConfig(cell, draft.format)).filter((cell) => cell != null);
    const trailer = (draft.trailer || []).map((cell) => this.cellToConfig(cell, draft.format)).filter((cell) => cell != null);
    if (header.length) {
      layout.header = header;
    }
    if (trailer.length) {
      layout.trailer = trailer;
    }
    const payload: any = this.withRuntime(
      {
        ...draft.preserved,
        format: draft.format,
        ...(draft.encoding?.trim() ? { encoding: draft.encoding.trim() } : {}),
        layout,
        ...(draft.archiveNameTemplate?.trim() ? { archiveNameTemplate: draft.archiveNameTemplate.trim() } : {}),
      },
      draft,
      'once',
    );
    // Backend FILE_WRITE es once-task (pagina la tabla el mismo); nunca batch/per-record.
    payload.executionMode = 'once';
    // XLSX (ADR-016): opciones de formato bajo `xlsx`. Se emiten solo los valores != default (el XlsxWriter aplica
    // sheetName=Sheet1, headerStyle=BOLD, freezeHeader=true, autoFilter/autoSize=false por defecto).
    if (draft.format === 'XLSX') {
      const x = draft.xlsx;
      const xlsx: any = {};
      if (x.sheetName?.trim()) xlsx.sheetName = x.sheetName.trim();
      if (x.headerStyle === 'PLAIN') xlsx.headerStyle = 'PLAIN';
      if (x.freezeHeader === false) xlsx.freezeHeader = false;
      if (x.autoFilter) xlsx.autoFilter = true;
      if (x.autoSizeColumns) xlsx.autoSizeColumns = true;
      if (Object.keys(xlsx).length) payload.xlsx = xlsx;
    }
    // ADR-016 / ADR-004: fuente de datos (modo DERIVADO). SIN tarea de origen -> tabla directa (keyset); el motor
    // exige input.source='task-output' + input.sourceOutput='table', y FILE_WRITE pagina la tabla el mismo
    // (cursor.orderBy requerido). CON tarea de origen -> records (withRuntime ya emitio el input arriba).
    if (!draft.input?.sourceTaskRef) {
      const ts = draft.tableSource;
      const batchSize = this.numOrUndefined(ts.batchSize);
      payload.input = {
        source: 'task-output',
        sourceOutput: 'table',
        ...(ts.table?.trim() ? { table: ts.table.trim() } : {}),
        ...(ts.connectionRef?.trim() ? { connectionRef: ts.connectionRef.trim() } : {}),
        cursor: { orderBy: ts.orderBy?.trim() || 'id' },
        ...(ts.payloadColumn?.trim() ? { payloadColumn: ts.payloadColumn.trim() } : {}),
        ...(batchSize != null ? { batchSize } : {}),
        // Se emite la LISTA de filas tal cual (incluidas las incompletas en edicion): el draft round-trips por
        // configurationJson, y cerrar a mapa aca borraba la fila recien agregada (columna vacia) antes de poder
        // tipearla. El backend acepta la lista e ignora las filas sin columna (patron columns/rules).
        ...(ts.filters.length ? { filters: ts.filters.map((f) => ({ column: f.column, value: f.value })) } : {}),
      };
    } else if (payload.input && payload.input.sourceOutput === 'table' && !payload.input.cursor) {
      // Modo records donde la tarea de origen PRODUCE una tabla (p.ej. DB_WRITE -> FILE_WRITE): se conserva el
      // sourceTaskRef que puso el runtime panel; el backend exige cursor.orderBy para la paginacion keyset.
      payload.input.cursor = { orderBy: 'id' };
    }
    return { configurationJson: this.toPrettyJson(payload) };
  }

  private numOrUndefined(value: unknown): number | undefined {
    const text = String(value ?? '').trim();
    if (!text) return undefined;
    const parsed = Number(text);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  // --- helpers de serializacion ---

  private columnToConfig(column: FileWriteColumnDraft, format: FileWriteFormat): Record<string, unknown> {
    const config: any = { field: column.field.trim() };
    // Expresion: se emite si esta PRESENTE aunque sea vacia, para que el modo 'fx' sobreviva el round-trip (el
    // draft round-trips en cada cambio; filtrarla apagaria el toggle al instante). El backend ignora las vacias.
    if (column.expression != null) config.expression = column.expression.trim();
    // type/format aplican a CSV y TXT (formateo de campos): NUMBER con patron decimal, DATE con patron.
    // El patron solo tiene sentido con un type != STRING; si no, se descarta (no ensuciar el config).
    if (column.type && column.type !== 'STRING') {
      config.type = column.type;
      if (column.format?.trim()) config.format = column.format.trim();
      // rounding solo aplica a NUMBER; se emite unicamente si difiere del default backend (HALF_UP). Passthrough:
      // se preserva cualquier modo (no solo los del dropdown) para que el round-trip no pierda datos.
      if (column.type === 'NUMBER') {
        const rounding = this.normalizeRounding(column.rounding);
        if (rounding && rounding !== 'HALF_UP') config.rounding = rounding;
      }
    }
    if (format === 'TXT') {
      const length = this.numOrUndefined(column.length);
      if (length != null) config.length = length;
      if (column.align) config.align = column.align;
      if (column.pad != null && String(column.pad) !== '') config.pad = String(column.pad);
    }
    return config;
  }

  private cellToConfig(cell: FileWriteCellDraft, format: FileWriteFormat): Record<string, unknown> | null {
    const config: any = {};
    if (cell.kind === 'value') {
      config.value = cell.value ?? '';
    } else if (cell.kind === 'metadata') {
      // Default (igual que el <mat-select> del template) para que la celda sobreviva el round-trip apenas se
      // elige 'metadata', antes de seleccionar el valor concreto — si no, se filtraba y la celda desaparecia.
      config.metadata = cell.metadata?.trim() || '_processExecutionId';
    } else if (cell.kind === 'aggregate') {
      config.aggregate = cell.aggregate === 'sum' ? 'sum' : 'count';
      if (config.aggregate === 'sum' && cell.field?.trim()) config.field = cell.field.trim();
    } else if (cell.kind === 'binding') {
      // Se emiten siempre las 3 claves (aunque sourceKey este vacio) para que la celda sobreviva el round-trip
      // mientras se configura; el backend resuelve a celda vacia si sourceKey no matchea.
      config.sourceOutput = cell.sourceOutput === 'out' ? 'out' : 'summary';
      config.sourceTaskRef = cell.sourceTaskRef?.trim() || '';
      config.sourceKey = cell.sourceKey?.trim() || '';
    } else {
      return null;
    }
    if (format === 'TXT') {
      const length = this.numOrUndefined(cell.length);
      if (length != null) config.length = length;
      if (cell.align) config.align = cell.align;
      if (cell.pad != null && String(cell.pad) !== '') config.pad = String(cell.pad);
    }
    return config;
  }

  // --- helpers de hidratacion ---

  private normalizeFormat(value: unknown): FileWriteFormat {
    const normalized = String(value || 'CSV').toUpperCase();
    return normalized === 'TXT' || normalized === 'XLSX' ? normalized : 'CSV';
  }

  private normalizeColumnType(value: unknown): FileWriteColumnType {
    const normalized = String(value || 'STRING').toUpperCase();
    return normalized === 'NUMBER' || normalized === 'DATE' ? normalized : 'STRING';
  }

  // Passthrough: normaliza a mayusculas sin colapsar modos desconocidos (el backend valida y hace fail-safe).
  private normalizeRounding(value: unknown): string {
    return String(value ?? '').trim().toUpperCase();
  }

  private hydrateColumns(raw: unknown): FileWriteColumnDraft[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item) => item && typeof item === 'object')
      .map((item: any) => ({
        field: String(item.field || ''),
        ...(item.expression != null ? { expression: String(item.expression) } : {}),
        ...(item.type ? { type: this.normalizeColumnType(item.type) } : {}),
        ...(item.format != null ? { format: String(item.format) } : {}),
        ...(this.normalizeRounding(item.rounding) ? { rounding: this.normalizeRounding(item.rounding) } : {}),
        ...(item.length != null ? { length: String(item.length) } : {}),
        ...(item.align === 'right' ? { align: 'right' as const } : {}),
        ...(item.pad != null ? { pad: String(item.pad) } : {}),
      }));
  }

  private hydrateCells(raw: unknown): FileWriteCellDraft[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item) => item && typeof item === 'object')
      .map((item: any): FileWriteCellDraft => {
        const base = {
          ...(item.length != null ? { length: String(item.length) } : {}),
          ...(item.align === 'right' ? { align: 'right' as const } : {}),
          ...(item.pad != null ? { pad: String(item.pad) } : {}),
        };
        if (item.aggregate != null) {
          return { kind: 'aggregate', aggregate: item.aggregate === 'sum' ? 'sum' : 'count', ...(item.field != null ? { field: String(item.field) } : {}), ...base };
        }
        if (item.metadata != null) {
          return { kind: 'metadata', metadata: String(item.metadata), ...base };
        }
        if (item.sourceOutput != null || item.sourceKey != null) {
          return {
            kind: 'binding',
            sourceOutput: String(item.sourceOutput) === 'out' ? 'out' : 'summary',
            sourceTaskRef: String(item.sourceTaskRef ?? ''),
            sourceKey: String(item.sourceKey ?? ''),
            ...base,
          };
        }
        return { kind: 'value', value: String(item.value ?? ''), ...base };
      });
  }
}
