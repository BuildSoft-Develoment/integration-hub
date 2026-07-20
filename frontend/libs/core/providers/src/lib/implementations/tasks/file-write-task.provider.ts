// @trace ADR-016 (procesos: contrato configuration_json de la tarea FILE_WRITE)
import { Injectable } from '@angular/core';
import { ProcessTaskRuntimeDraft } from '../../tasks/process-task-binding.models';
import { ProcessTaskProvider } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

export type FileWriteFormat = 'CSV' | 'TXT' | 'XLSX';
export type FileWriteAlign = 'left' | 'right';
export type FileWriteColumnType = 'STRING' | 'NUMBER' | 'DATE';
// Modos de redondeo (RoundingMode de Java) que ofrece la UI; el backend acepta cualquier nombre valido, por eso
// el campo es passthrough (string): un modo agregado o hand-edited se preserva en el round-trip, no se colapsa.
export type FileWriteRounding = 'HALF_UP' | 'HALF_EVEN' | 'DOWN';
export type FileWriteCellKind = 'value' | 'metadata' | 'aggregate';

export interface FileWriteColumnDraft {
  field: string;
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
  length?: string;
  align?: FileWriteAlign;
  pad?: string;
}

// ADR-016 / ADR-004: modo de origen de los datos que se serializan.
//  - 'records': la salida (en memoria) de una tarea previa (X -> FILE_WRITE); la tarea de origen se elige en el
//    runtime panel (input.sourceTaskRef). Volumenes chicos/medianos.
//  - 'table': lectura DIRECTA de una tabla con paginacion keyset (input.sourceOutput='table'); escala a >1M.
export type FileWriteSourceMode = 'records' | 'table';

/** Config del modo 'table' (se serializa bajo `input`). */
export interface FileWriteTableSourceDraft {
  table: string;
  connectionRef: string;
  orderBy: string;
  payloadColumn: string;
  batchSize: string;
}

export interface FileWriteTaskDraft extends ProcessTaskRuntimeDraft {
  format: FileWriteFormat;
  encoding: string;
  lineEnding: 'LF' | 'CRLF';
  delimiter: string;
  columns: FileWriteColumnDraft[];
  header: FileWriteCellDraft[];
  trailer: FileWriteCellDraft[];
  archiveNameTemplate: string;
  sourceMode: FileWriteSourceMode;
  tableSource: FileWriteTableSourceDraft;
}

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
      columns: [],
      header: [],
      trailer: [],
      archiveNameTemplate: '',
      sourceMode: 'records',
      tableSource: this.defaultTableSource(),
    };
  }

  private defaultTableSource(): FileWriteTableSourceDraft {
    return { table: '', connectionRef: '', orderBy: 'id', payloadColumn: '', batchSize: '' };
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
      columns: this.hydrateColumns(detail.columns),
      header: this.hydrateCells(layout.header),
      trailer: this.hydrateCells(layout.trailer),
      archiveNameTemplate: String(config.archiveNameTemplate || ''),
      ...this.hydrateSource(config.input),
    };
  }

  // Deriva el modo de origen y la config de tabla del bloque `input` crudo (hydrateRuntime solo conserva input si
  // hay sourceTaskRef, y no arrastra cursor/payloadColumn; para el modo tabla standalone se lee aqui directo).
  private hydrateSource(rawInput: unknown): Pick<FileWriteTaskDraft, 'sourceMode' | 'tableSource'> {
    const input = rawInput && typeof rawInput === 'object' && !Array.isArray(rawInput) ? (rawInput as any) : {};
    const sourceOutput = String(input.sourceOutput || '').trim().toLowerCase();
    // El modo 'table' de la UI es la tabla DIRECTA/standalone (sin tarea de origen). Un sourceOutput='table' CON
    // sourceTaskRef es el caso "X produce una tabla" (p.ej. DB_WRITE -> FILE_WRITE, que lee taskOutputs[X.table]):
    // ese sigue siendo modo 'records' (lo maneja el selector de tarea de origen del runtime panel), no standalone.
    const hasSourceTask = !!String(input.sourceTaskRef || '').trim();
    const isTable = (sourceOutput === 'table' || sourceOutput === 'targettable') && !hasSourceTask;
    const cursor = input.cursor && typeof input.cursor === 'object' ? input.cursor : {};
    return {
      sourceMode: isTable ? 'table' : 'records',
      tableSource: {
        table: String(input.table || ''),
        connectionRef: String(input.connectionRef || ''),
        orderBy: String(cursor.orderBy || 'id'),
        payloadColumn: String(input.payloadColumn || ''),
        batchSize: input.batchSize != null && String(input.batchSize).trim() ? String(input.batchSize) : '',
      },
    };
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
    // ADR-016 / ADR-004: fuente de datos.
    if (draft.sourceMode === 'table') {
      // Modo tabla (directa, keyset). El motor (TaskInputResolver) exige input.source='task-output' e
      // input.sourceOutput='table'; FILE_WRITE pagina la tabla el mismo (cursor.orderBy requerido). Se OMITE
      // cualquier input basado en sourceTaskRef del runtime panel: en modo tabla no hay tarea de origen.
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
        return { kind: 'value', value: String(item.value ?? ''), ...base };
      });
  }
}
