// @trace RF-002 (procesos: contrato configuration_json de tarea tipo REST_CALL)
import { Injectable } from '@angular/core';
import { HttpRequestDraft, ProcessTaskBodyFieldBindingDraft, ProcessTaskExecutionMode, ProcessTaskRuntimeDraft } from '../../../tasks/process-task-binding.models';
import {
  applyHttpRequestToPayload,
  buildUrl,
  createHttpRequestDraft,
  hydrateHttpRequest,
} from '../../../tasks/http-request-task.support';
import { I18nService } from '@integration-hub/core/i18n';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../../tasks/process-task-provider.abstract';
import { ProcessTaskFormModel } from '../../../tasks/process-task.models';

export interface RestCallTaskDraft extends ProcessTaskRuntimeDraft, HttpRequestDraft {
  mode: string;
  bodyMappings: ProcessTaskBodyFieldBindingDraft[];
  headersJson: string;
  /** Claves que el backend lee y NINGUN campo del form escribe; viajan verbatim. */
  preserved: Record<string, unknown>;
}

/**
 * {@code HttpRequestSupport} lee estas dos, pero no existen en {@code HttpRequestDraft}, asi que
 * {@code applyHttpRequestToPayload} nunca las emite: se perdian en CADA guardado. {@code tokenTtlSeconds}
 * gobierna cuanto se cachea el token del login; volver a su default puede multiplicar los logins contra el
 * gateway del banco (o dejar de refrescar antes de tiempo). Mismo caso ya corregido en NOTIFICATION y
 * MT101_INBOUND_DELIVER.
 */
const REST_CALL_PRESERVED_KEYS = ['loginTimeoutSeconds', 'tokenTtlSeconds'] as const;

@Injectable()
export class RestCallTaskProvider extends ProcessTaskProvider<RestCallTaskDraft> {
  readonly descriptor = {
    type: 'REST_CALL' as const,
    labelKey: 'processTask.REST_CALL',
    descriptionKey: 'processTaskDescription.REST_CALL',
    modalLayout: 'rest' as const,
  };

  createDraft(): RestCallTaskDraft {
    return {
      ...createHttpRequestDraft('POST', '20'),
      taskRef: '',
      executionMode: 'per-record',
      mode: 'per-record',
      bodyMappings: [],
      headersJson: '{}',
      preserved: {},
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): RestCallTaskDraft {
    const config: any = this.parseJson(task.configurationJson);
    return {
      ...this.hydrateRuntime(task, 'per-record'),
      ...hydrateHttpRequest(config, 20),
      mode: String(config.executionMode || config.mode || 'per-record'),
      bodyMappings: [],
      headersJson: JSON.stringify(config.headers || {}, null, 2),
      preserved: this.preserveKeys(config, REST_CALL_PRESERVED_KEYS),
    };
  }

  toTaskPatch(draft: RestCallTaskDraft): Partial<ProcessTaskFormModel> {
    const executionMode = normalizeExecutionMode(draft.executionMode || draft.mode);
    // `preserved` solo trae claves que applyHttpRequestToPayload NO escribe, asi que no puede resucitar un
    // token borrado ni un authType apagado (el fallo que si aparecia al preservar el slice HTTP completo).
    const payload: any = this.withRuntime(
      { ...draft.preserved, mode: executionMode }, { ...draft, executionMode }, 'per-record');
    applyHttpRequestToPayload(draft, payload, 20);
    return { configurationJson: this.toPrettyJson(payload) };
  }

  override summarize(task: ProcessTaskFormModel, _context: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    const target = [config.method, config.url || buildUrl(config.baseUrl, config.pathTemplate, config.queryParameters)].filter(Boolean).join(' ');
    return [i18n.t(this.descriptor.labelKey), target && i18n.t('ui.taskSummary.rest', { value: target })]
      .filter(Boolean)
      .join(' | ');
  }
}

function normalizeExecutionMode(value: string | undefined): ProcessTaskExecutionMode {
  if (value === 'single-request') {
    return 'once';
  }
  return value === 'once' || value === 'batch' || value === 'per-record'
    ? value
    : 'per-record';
}
