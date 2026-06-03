// @trace RF-002 (procesos: contrato configuration_json de tarea tipo DB_WRITE)
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

export interface DbWriteMappingDraft {
  targetColumn: string;
  sourceKind: 'field' | 'variable' | 'metadata' | 'expression' | null;
  sourceKey: string;
  sourceLabel: string;
  expression: string;
  key: boolean;
}

export interface DbWriteTaskDraft {
  connectionRef: string;
  mode: string;
  targetSchema: string;
  targetTable: string;
  jdbcBatchSize: string;
  mappings: DbWriteMappingDraft[];
}

@Injectable()
export class DbWriteTaskProvider extends ProcessTaskProvider<DbWriteTaskDraft> {
  readonly descriptor = {
    type: 'DB_WRITE' as const,
    labelKey: 'processTask.DB_WRITE',
    descriptionKey: 'processTaskDescription.DB_WRITE',
    modalLayout: 'workspace' as const,
  };

  createDraft(): DbWriteTaskDraft {
    return {
      connectionRef: '',
      mode: 'insert',
      targetSchema: '',
      targetTable: '',
      jdbcBatchSize: '1000',
      mappings: [],
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): DbWriteTaskDraft {
    const config: any = this.parseJson(task.configurationJson);
    const { schema, table } = this.splitQualifiedTable(String(config.targetTable || ''));
    const keyColumnValues = Array.isArray(config.keyColumns) ? config.keyColumns.map((value: unknown) => String(value)) : [];
    const keyColumns = new Set<string>(keyColumnValues);
    const mappedRows = Object.entries(config.columnMappings || {}).map(([targetColumn, sourceKey]) => ({
      targetColumn,
      sourceKind: 'field' as const,
      sourceKey: String(sourceKey),
      sourceLabel: String(sourceKey),
      expression: '',
      key: keyColumns.has(targetColumn),
    }));
    const functionRows = Object.entries(config.columnFunctions || {}).map(([targetColumn, expression]) => ({
      targetColumn,
      sourceKind: 'expression' as const,
      sourceKey: '',
      sourceLabel: '',
      expression: String(expression),
      key: keyColumns.has(targetColumn),
    }));
    const rowsByColumn = new Map<string, DbWriteMappingDraft>();
    [...mappedRows, ...functionRows].forEach((row) => rowsByColumn.set(row.targetColumn, row));
    keyColumnValues.forEach((column: string) => {
      if (!rowsByColumn.has(column)) {
        rowsByColumn.set(column, {
          targetColumn: column,
          sourceKind: null,
          sourceKey: '',
          sourceLabel: '',
          expression: '',
          key: true,
        });
      }
    });
    return {
      connectionRef: String(config.connectionRef || ''),
      mode: String(config.mode || 'insert'),
      targetSchema: schema,
      targetTable: table,
      jdbcBatchSize: String(config.jdbcBatchSize ?? 1000),
      mappings: Array.from(rowsByColumn.values()),
    };
  }

  toTaskPatch(draft: DbWriteTaskDraft): Partial<ProcessTaskFormModel> {
    const qualifiedTable = [draft.targetSchema, draft.targetTable]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .join('.');
    const keyColumns = draft.mappings
      .filter((row) => row.key && row.sourceKind !== 'expression')
      .map((row) => row.targetColumn)
      .filter(Boolean);
    const columnMappings = draft.mappings.reduce<Record<string, string>>((accumulator, row) => {
      if (row.sourceKind && row.sourceKind !== 'expression' && row.sourceKey) {
        accumulator[row.targetColumn] = row.sourceKey;
      }
      return accumulator;
    }, {});
    const columnFunctions = draft.mappings.reduce<Record<string, string>>((accumulator, row) => {
      if (row.expression?.trim()) {
        accumulator[row.targetColumn] = row.expression.trim();
      }
      return accumulator;
    }, {});
    const payload: any = {
      mode: draft.mode || 'insert',
      targetTable: qualifiedTable,
      jdbcBatchSize: Number(draft.jdbcBatchSize || 1000),
    };
    if (draft.connectionRef) payload.connectionRef = draft.connectionRef;
    if (keyColumns.length) payload.keyColumns = keyColumns;
    if (Object.keys(columnMappings).length) payload.columnMappings = columnMappings;
    if (Object.keys(columnFunctions).length) payload.columnFunctions = columnFunctions;
    return {
      configurationJson: this.toPrettyJson(payload),
    };
  }

  override summarize(task: ProcessTaskFormModel, _context: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    const parts = [i18n.t(this.descriptor.labelKey)];
    if (config.connectionRef) parts.push(i18n.t('ui.taskSummary.connection', { value: config.connectionRef }));
    if (config.targetTable) {
      const targetLabel = config.targetSchema ? `${config.targetSchema}.${config.targetTable}` : config.targetTable;
      parts.push(i18n.t('ui.taskSummary.targetTable', { value: targetLabel }));
    }
    return parts.join(' | ');
  }

  private splitQualifiedTable(value: string): { schema: string; table: string } {
    const normalized = String(value || '').trim();
    if (!normalized) {
      return { schema: '', table: '' };
    }
    const parts = normalized.split('.').map((part) => part.trim()).filter(Boolean);
    if (parts.length <= 1) {
      return { schema: '', table: normalized };
    }
    return {
      schema: parts.slice(0, -1).join('.'),
      table: parts[parts.length - 1],
    };
  }
}


