// @trace spec 003-diseno-y-ejecucion-procesos RF-002 (procesos: contrato configuration_json de tarea tipo DB_WRITE)
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/i18n';
import { ProcessTaskRuntimeDraft } from '../../../tasks/process-task-binding.models';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../../tasks/process-task-provider.abstract';
import { ProcessTaskFormModel } from '../../../tasks/process-task.models';

export interface DbWriteMappingDraft {
  targetColumn: string;
  sourceKind: 'field' | 'variable' | 'metadata' | 'summary' | 'records' | 'table' | 'errors' | 'out' | 'fragments' | 'expression' | null;
  sourceKey: string;
  sourceLabel: string;
  expression: string;
  key: boolean;
}

export interface DbWriteTaskDraft extends ProcessTaskRuntimeDraft {
  connectionRef: string;
  mode: string;
  targetSchema: string;
  targetTable: string;
  jdbcBatchSize: string;
  mappings: DbWriteMappingDraft[];
}

/**
 * 011: tabla de staging por defecto del money-path. Es el destino cuando la tarea usa el "Datasource de la
 * plataforma" ({@code connectionRef} vacio); con una conexion externa la tabla queda vacia para que el usuario
 * la elija. Fuente unica: la usa este provider en {@link DbWriteTaskProvider.createDraft} y el form al cambiar
 * de conexion (no duplicar el literal).
 */
export const DB_WRITE_DEFAULT_PLATFORM_TABLE = 'staging_record';

/**
 * Lote de INSERT de DB_WRITE cuando la clave no viene en la configuracion.
 *
 * Debe coincidir con el default del backend: `DbTaskSupport.jdbcBatchSize()` devuelve 500. La UI
 * proponia 1000 en tres sitios distintos (borrador nuevo, hidratacion y envio), de modo que la MISMA
 * tarea se comportaba distinto segun por donde entrara: creada por API sin la clave usaba 500, creada
 * o editada por el formulario usaba 1000. Se alinea al backend, que es la fuente de verdad.
 *
 * Ojo al cambiarlo: NO es un no-op. Medido en el entorno de integracion, 0 de 18 tareas DB_WRITE guardadas
 * declaran la clave, o sea que la poblacion real cae entera en el caso "nunca la declararon" y el backend ya
 * las venia ejecutando a 500. El riesgo que esto elimina es el INVERSO al que parece: abrir una de esas
 * tareas en el formulario y guardarla le inyectaba jdbcBatchSize=1000 y le duplicaba en silencio el lote
 * efectivo. Una tarea que SI trae el valor explicito conserva el suyo y no se ve afectada.
 *
 * No confundir con `batchSize` (lote FUNCIONAL de registros que trocea el motor, default 1000 en
 * ProcessTaskRuntimeService) ni con `input.batchSize`, que tiene prioridad sobre aquel. Son tres
 * conceptos distintos con nombres casi iguales.
 */
export const DB_WRITE_DEFAULT_JDBC_BATCH_SIZE = 500;

@Injectable()
export class DbWriteTaskProvider extends ProcessTaskProvider<DbWriteTaskDraft> {
  readonly descriptor = {
    type: 'DB_WRITE' as const,
    labelKey: 'processTask.DB_WRITE',
    descriptionKey: 'processTaskDescription.DB_WRITE',
    modalLayout: 'workspace' as const,
  };

  /** Todo lo que emite `toTaskPatch`; el resto de la config lo preserva la clase base. */
  override get governedKeys(): readonly string[] {
    return [
      'mode',
      'targetTable',
      'jdbcBatchSize',
      'connectionRef',
      'keyColumns',
      'columnMappings',
      'columnSources',
      'columnFunctions',
    ];
  }

  createDraft(): DbWriteTaskDraft {
    return {
      taskRef: '',
      executionMode: 'batch',
      connectionRef: '',
      mode: 'insert',
      targetSchema: '',
      // 011: una tarea nueva arranca con el datasource de la plataforma (connectionRef vacio) -> tabla por
      // defecto. Antes quedaba vacia y el prefill solo aparecia si el usuario tocaba el selector de conexion.
      targetTable: DB_WRITE_DEFAULT_PLATFORM_TABLE,
      jdbcBatchSize: String(DB_WRITE_DEFAULT_JDBC_BATCH_SIZE),
      mappings: [],
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): DbWriteTaskDraft {
    const config: any = this.parseJson(task.configurationJson);
    const { schema, table } = this.splitQualifiedTable(String(config.targetTable || ''));
    const keyColumnValues = Array.isArray(config.keyColumns) ? config.keyColumns.map((value: unknown) => String(value)) : [];
    const keyColumns = new Set<string>(keyColumnValues);
    const columnSources: Record<string, { kind?: string; key?: string }> = (config.columnSources && typeof config.columnSources === 'object' && !Array.isArray(config.columnSources))
      ? config.columnSources
      : {};
    const mappedRows = Object.entries(config.columnMappings || {}).map(([targetColumn, resolvedKey]) => {
      // Origen rico (P1.b): si hay columnSources se restaura kind/clave original; si no, es legacy -> field.
      const origin = columnSources[targetColumn];
      const kind = (origin?.kind ? String(origin.kind) : 'field') as DbWriteMappingDraft['sourceKind'];
      const key = origin?.key != null ? String(origin.key) : String(resolvedKey);
      return {
        targetColumn,
        sourceKind: kind,
        sourceKey: key,
        sourceLabel: key,
        expression: '',
        key: keyColumns.has(targetColumn),
      };
    });
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
      ...this.hydrateRuntime(task, 'batch'),
      connectionRef: String(config.connectionRef || ''),
      mode: String(config.mode || 'insert'),
      targetSchema: schema,
      targetTable: table,
      jdbcBatchSize: String(config.jdbcBatchSize ?? DB_WRITE_DEFAULT_JDBC_BATCH_SIZE),
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
    // P1.b: para cada columna mapeada persistimos (a) la CLAVE DE RESOLUCION en columnMappings —
    // calificada `taskRef.output.campo` para outputs agregados (summary/out/table) para que el
    // backend la resuelva sin colision desde el registro enriquecido (metadata + taskOutputs), y
    // (b) el ORIGEN en columnSources (kind/clave/taskRef/output) para el round-trip de la UI.
    const sourceTaskRef = (draft.input?.sourceTaskRef || '').trim();
    const isAggregate = (kind: DbWriteMappingDraft['sourceKind']): boolean =>
      kind === 'summary' || kind === 'out' || kind === 'table';
    const columnMappings: Record<string, string> = {};
    const columnSources: Record<string, { kind: string; key: string; taskRef?: string; output?: string }> = {};
    draft.mappings.forEach((row) => {
      if (row.sourceKind && row.sourceKind !== 'expression' && row.sourceKey) {
        const kind = row.sourceKind;
        const qualified = isAggregate(kind) && sourceTaskRef;
        columnMappings[row.targetColumn] = qualified ? `${sourceTaskRef}.${kind}.${row.sourceKey}` : row.sourceKey;
        columnSources[row.targetColumn] = qualified
          ? { kind, key: row.sourceKey, taskRef: sourceTaskRef, output: kind }
          : { kind, key: row.sourceKey };
      }
    });
    const columnFunctions = draft.mappings.reduce<Record<string, string>>((accumulator, row) => {
      if (row.expression?.trim()) {
        accumulator[row.targetColumn] = row.expression.trim();
      }
      return accumulator;
    }, {});
    const payload: any = this.withRuntime({
      mode: draft.mode || 'insert',
      targetTable: qualifiedTable,
      jdbcBatchSize: Number(draft.jdbcBatchSize || DB_WRITE_DEFAULT_JDBC_BATCH_SIZE),
    }, draft, 'batch');
    if (draft.connectionRef) payload.connectionRef = draft.connectionRef;
    if (keyColumns.length) payload.keyColumns = keyColumns;
    if (Object.keys(columnMappings).length) payload.columnMappings = columnMappings;
    if (Object.keys(columnSources).length) payload.columnSources = columnSources;
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
