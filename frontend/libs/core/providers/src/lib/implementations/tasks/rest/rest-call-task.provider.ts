// @trace spec 003-diseno-y-ejecucion-procesos RF-002 (procesos: contrato configuration_json de tarea tipo REST_CALL)
import { Injectable } from '@angular/core';
import { HttpRequestDraft, ProcessTaskBodyFieldBindingDraft, ProcessTaskExecutionMode, ProcessTaskRuntimeDraft } from '../../../tasks/process-task-binding.models';
import {
  HTTP_REQUEST_KEYS,
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
}

@Injectable()
export class RestCallTaskProvider extends ProcessTaskProvider<RestCallTaskDraft> {
  readonly descriptor = {
    type: 'REST_CALL' as const,
    labelKey: 'processTask.REST_CALL',
    descriptionKey: 'processTaskDescription.REST_CALL',
    modalLayout: 'rest' as const,
  };

  /**
   * `mode` mas el slice HTTP completo. Reemplaza a `REST_CALL_PRESERVED_KEYS`, que solo protegia
   * `loginTimeoutSeconds` y `tokenTtlSeconds` —las dos que el backend lee y ningun campo escribe—:
   * ahora sobrevive cualquier clave que el formulario no gobierne, no solo esas dos.
   */
  override get governedKeys(): readonly string[] {
    return ['mode', ...HTTP_REQUEST_KEYS];
  }

  createDraft(): RestCallTaskDraft {
    return {
      ...createHttpRequestDraft('POST', '20'),
      taskRef: '',
      executionMode: 'per-record',
      mode: 'per-record',
      bodyMappings: [],
      headersJson: '{}',
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
    };
  }

  toTaskPatch(draft: RestCallTaskDraft): Partial<ProcessTaskFormModel> {
    const executionMode = normalizeExecutionMode(draft.executionMode || draft.mode);
    const payload: any = this.withRuntime(
      { mode: executionMode }, { ...draft, executionMode }, 'per-record');
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
