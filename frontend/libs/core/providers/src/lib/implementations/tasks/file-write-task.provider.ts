// @trace ADR-016 (procesos: contrato configuration_json de la tarea FILE_WRITE)
import { Injectable } from '@angular/core';
import { ProcessTaskRuntimeDraft } from '../../tasks/process-task-binding.models';
import { ProcessTaskProvider } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

export type FileWriteFormat = 'CSV' | 'TXT' | 'XLSX';
export type FileWriteAlign = 'left' | 'right';
export type FileWriteColumnType = 'STRING' | 'NUMBER' | 'DATE';
export type FileWriteCellKind = 'value' | 'metadata' | 'aggregate';

export interface FileWriteColumnDraft {
  field: string;
  type?: FileWriteColumnType;
  format?: string;
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

export interface FileWriteTaskDraft extends ProcessTaskRuntimeDraft {
  format: FileWriteFormat;
  encoding: string;
  lineEnding: 'LF' | 'CRLF';
  delimiter: string;
  columns: FileWriteColumnDraft[];
  header: FileWriteCellDraft[];
  trailer: FileWriteCellDraft[];
  archiveNameTemplate: string;
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
    };
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
    };
  }

  toTaskPatch(draft: FileWriteTaskDraft): Partial<ProcessTaskFormModel> {
    const detail: any = {
      columns: (draft.columns || []).filter((column) => column.field?.trim()).map((column) => this.columnToConfig(column, draft.format)),
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
    // Fuente-tabla: el backend exige cursor.orderBy (paginacion keyset). Default 'id' (PK de staging_record).
    if (payload.input && payload.input.sourceOutput === 'table' && !payload.input.cursor) {
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
    if (column.type && column.type !== 'STRING') config.type = column.type;
    if (column.format?.trim()) config.format = column.format.trim();
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
      if (!cell.metadata?.trim()) return null;
      config.metadata = cell.metadata.trim();
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

  private hydrateColumns(raw: unknown): FileWriteColumnDraft[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item) => item && typeof item === 'object')
      .map((item: any) => ({
        field: String(item.field || ''),
        ...(item.type ? { type: this.normalizeColumnType(item.type) } : {}),
        ...(item.format != null ? { format: String(item.format) } : {}),
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
