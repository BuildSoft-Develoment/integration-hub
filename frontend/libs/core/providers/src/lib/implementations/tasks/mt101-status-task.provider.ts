// @trace spec 008-mensajeria-pagos RF-005, T-013
// @trace ADR-009
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskRuntimeDraft } from '../../tasks/process-task-binding.models';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

export type Mt101StatusMode = 'query' | 'poll' | 'callback';

/** Draft del formulario MT101_STATUS. */
export interface Mt101StatusTaskDraft extends ProcessTaskRuntimeDraft {
  mode: Mt101StatusMode;
  queryUrl: string;
  queryMethod: string;
  queryTimeoutSeconds: number;
  statusField: string;
  referenceField: string;
  errorMessageField: string;
  connectionRef: string;
  confirmationTable: string;
}

/**
 * Provider del task type {@code MT101_STATUS}.
 *
 * <p>Slice 2.2 backend implementa solo {@code mode: "query"} (single-shot HTTP
 * por record). Los modos {@code poll} y {@code callback} requieren M-2
 * (long-running) y son rechazados explicitamente por el backend.</p>
 */
@Injectable()
export class Mt101StatusTaskProvider extends ProcessTaskProvider<Mt101StatusTaskDraft> {
  readonly descriptor = {
    type: 'MT101_STATUS' as const,
    labelKey: 'processTask.MT101_STATUS',
    descriptionKey: 'processTaskDescription.MT101_STATUS',
    modalLayout: 'workspace' as const,
  };

  createDraft(): Mt101StatusTaskDraft {
    return {
      taskRef: '',
      executionMode: 'per-record',
      mode: 'query',
      queryUrl: '',
      queryMethod: 'GET',
      queryTimeoutSeconds: 30,
      statusField: '$.status',
      referenceField: '$.gatewayReference',
      errorMessageField: '$.error.message',
      connectionRef: '',
      confirmationTable: 'mt101_confirmation',
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): Mt101StatusTaskDraft {
    const config: Record<string, any> = this.parseJson(task.configurationJson);
    const runtime = this.hydrateRuntime(task, 'per-record');
    const query = (config['query'] || {}) as Record<string, any>;
    const expected = (config['expectedGatewayResponse'] || {}) as Record<string, any>;
    return {
      ...runtime,
      mode: this.normalizeMode(config['mode']),
      queryUrl: String(query['url'] || ''),
      queryMethod: String(query['method'] || 'GET'),
      queryTimeoutSeconds: Number(query['timeoutSeconds']) || 30,
      statusField: String(expected['statusField'] || '$.status'),
      referenceField: String(expected['referenceField'] || '$.gatewayReference'),
      errorMessageField: String(expected['errorMessageField'] || '$.error.message'),
      connectionRef: String(config['connectionRef'] || ''),
      confirmationTable: String(config['confirmationTable'] || 'mt101_confirmation'),
    };
  }

  toTaskPatch(draft: Mt101StatusTaskDraft): Partial<ProcessTaskFormModel> {
    const payload: Record<string, unknown> = this.withRuntime(
      {
        mode: draft.mode,
        query: {
          url: draft.queryUrl,
          method: draft.queryMethod,
          timeoutSeconds: draft.queryTimeoutSeconds,
        },
        expectedGatewayResponse: {
          statusField: draft.statusField,
          referenceField: draft.referenceField,
          errorMessageField: draft.errorMessageField,
        },
        ...(draft.connectionRef ? { connectionRef: draft.connectionRef } : {}),
        confirmationTable: draft.confirmationTable,
      },
      draft,
      'per-record',
    );
    return { configurationJson: this.toPrettyJson(payload) };
  }

  override summarize(task: ProcessTaskFormModel, _ctx: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    return [i18n.t(this.descriptor.labelKey), `${config.mode} ${config.queryUrl || '?'}`].join(' | ');
  }

  private normalizeMode(value: unknown): Mt101StatusMode {
    const v = String(value || 'query').toLowerCase();
    return v === 'poll' || v === 'callback' ? (v as Mt101StatusMode) : 'query';
  }
}
