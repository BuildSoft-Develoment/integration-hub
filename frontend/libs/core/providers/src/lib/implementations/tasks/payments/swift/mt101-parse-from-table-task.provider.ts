import { Injectable } from '@angular/core';
import { ProcessTaskProvider, ProcessTaskProviderDescriptor, ProcessTaskSummaryContext } from '../../../../tasks/process-task-provider.abstract';
import { ProcessTaskRuntimeDraft } from '../../../../tasks/process-task-binding.models';
import { ProcessTaskFormModel } from '../../../../tasks/process-task.models';
import { I18nService } from '@integration-hub/core/i18n';

/** Override de la tabla de staging (si se deja vacio, el backend lo deriva de la tarea de origen). */
export interface Mt101ParseFromTableSourceDraft {
  table: string;
  connectionRef: string;
  payloadColumn: string;
  idColumn: string;
}

/**
 * Draft de MT101_PARSE_FROM_TABLE. Refleja lo que lee el backend
 * ({@code Mt101ParseFromTableTaskProvider.execute/resolveSource}): pageSize + replaceExisting +
 * inboundSetIdTemplate + source (tabla staging + columnas). NO comparte los campos de MT101_PARSE
 * (interpretSequenceAB/publishMultiOutput), que el backend table-backed IGNORA.
 */
export interface Mt101ParseFromTableTaskDraft extends ProcessTaskRuntimeDraft {
  pageSize: number;
  replaceExisting: boolean;
  inboundSetIdTemplate: string;
  source: Mt101ParseFromTableSourceDraft;
  /** Claves top-level que el backend lee y el form no gobierna; viajan verbatim. */
  preserved: Record<string, unknown>;
  /** Idem DENTRO de `source`: el form reconstruye ese objeto entero y borraba el resto. */
  preservedSource: Record<string, unknown>;
}

/**
 * `connectionRef` top-level es el ultimo eslabon de la cadena de fallback que resuelve el datasource
 * (`Mt101ParseFromTableTaskProvider:189`); al perderlo, la lectura cae al datasource POR DEFECTO de la
 * plataforma: cambia de que base se lee el staging.
 */
const PARSE_FROM_TABLE_PRESERVED_KEYS = ['connectionRef'] as const;

/**
 * Claves de `source` que el backend lee y el form no expone:
 * - `processExecutionId` es el PIN para re-parsear un lote HISTORICO. Al perderlo, la lectura vuelve a la
 *   corrida actual → normalmente 0 filas → la tarea devuelve "skipped" como EXITO (silencioso).
 * - `taskDefinitionId` ausente ELIMINA el predicado y amplia la lectura a las filas de todas las tareas.
 */
const PARSE_FROM_TABLE_PRESERVED_SOURCE_KEYS = ['processExecutionId', 'taskDefinitionId'] as const;

const DEFAULT_PAGE_SIZE = 500;
const DEFAULT_INBOUND_SET_ID = 'INB-${_processExecutionId}-${_taskDefinitionId}';
const DEFAULT_PAYLOAD_COLUMN = 'payload_json';
const DEFAULT_ID_COLUMN = 'id';

/**
 * Provider del task type {@code MT101_PARSE_FROM_TABLE}: variante table-backed/paginada de MT101_PARSE para
 * ingestion inbound a escala. Ya NO reusa el form de MT101_PARSE (aquel exponia interpretSequenceAB/
 * publishMultiOutput, que el backend table-backed ignora, y NO exponia la config table-driven que si usa).
 */
@Injectable()
export class Mt101ParseFromTableTaskProvider extends ProcessTaskProvider<Mt101ParseFromTableTaskDraft> {
  readonly descriptor: ProcessTaskProviderDescriptor = {
    type: 'MT101_PARSE_FROM_TABLE' as const,
    labelKey: 'processTask.MT101_PARSE_FROM_TABLE',
    descriptionKey: 'processTaskDescription.MT101_PARSE_FROM_TABLE',
    category: 'swift-mt101',
    modalLayout: 'workspace' as const,
  };

  createDraft(): Mt101ParseFromTableTaskDraft {
    return {
      taskRef: '',
      executionMode: 'once',
      pageSize: DEFAULT_PAGE_SIZE,
      replaceExisting: true,
      inboundSetIdTemplate: DEFAULT_INBOUND_SET_ID,
      source: { table: '', connectionRef: '', payloadColumn: DEFAULT_PAYLOAD_COLUMN, idColumn: DEFAULT_ID_COLUMN },
      preserved: {},
      preservedSource: {},
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): Mt101ParseFromTableTaskDraft {
    const config: Record<string, any> = this.parseJson(task.configurationJson);
    const runtime = this.hydrateRuntime(task, 'once');
    const source = (config['source'] || {}) as Record<string, any>;
    return {
      ...runtime,
      pageSize: Number(config['pageSize']) || DEFAULT_PAGE_SIZE,
      replaceExisting: config['replaceExisting'] !== false,
      inboundSetIdTemplate: String(config['inboundSetIdTemplate'] || DEFAULT_INBOUND_SET_ID),
      source: {
        table: String(source['table'] || ''),
        connectionRef: String(source['connectionRef'] || ''),
        payloadColumn: String(source['payloadColumn'] || DEFAULT_PAYLOAD_COLUMN),
        idColumn: String(source['idColumn'] || DEFAULT_ID_COLUMN),
      },
      preserved: this.preserveKeys(config, PARSE_FROM_TABLE_PRESERVED_KEYS),
      preservedSource: this.preserveKeys(source, PARSE_FROM_TABLE_PRESERVED_SOURCE_KEYS),
    };
  }

  toTaskPatch(draft: Mt101ParseFromTableTaskDraft): Partial<ProcessTaskFormModel> {
    const payload: Record<string, unknown> = this.withRuntime(
      {
        ...draft.preserved,
        pageSize: draft.pageSize,
        replaceExisting: draft.replaceExisting,
        inboundSetIdTemplate: draft.inboundSetIdTemplate,
        // Overrides de la tabla staging; en blanco el backend los deriva de la tarea de origen / defaults.
        source: {
          ...draft.preservedSource,
          table: draft.source.table,
          connectionRef: draft.source.connectionRef,
          payloadColumn: draft.source.payloadColumn,
          idColumn: draft.source.idColumn,
        },
      },
      draft,
      'once',
    );
    return { configurationJson: this.toPrettyJson(payload) };
  }

  override summarize(task: ProcessTaskFormModel, _ctx: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    const table = config.source.table || 'staging_record';
    return [i18n.t(this.descriptor.labelKey), `${table} (pageSize=${config.pageSize})`].join(' | ');
  }
}
