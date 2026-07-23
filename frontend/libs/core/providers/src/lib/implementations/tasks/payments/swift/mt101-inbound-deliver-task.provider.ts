import { Injectable } from '@angular/core';
import { ProcessTaskProvider, ProcessTaskProviderDescriptor, ProcessTaskSummaryContext } from '../../../../tasks/process-task-provider.abstract';
import { HttpRequestDraft, ProcessTaskRuntimeDraft } from '../../../../tasks/process-task-binding.models';
import { applyHttpRequestToPayload, createHttpRequestDraft, hydrateHttpRequest } from '../../../../tasks/http-request-task.support';
import { ProcessTaskFormModel } from '../../../../tasks/process-task.models';
import { I18nService } from '@integration-hub/core/i18n';

export type Mt101InboundDeliverTransport = 'DB' | 'REST';

/**
 * Draft de MT101_INBOUND_DELIVER. Refleja lo que lee el backend
 * ({@code Mt101InboundDeliverTaskProvider.execute}): transporte DB/REST + pageSize. Para REST reusa el
 * contrato HTTP comun ({@link HttpRequestDraft}: url/method/auth/login/headers), igual que REST_CALL y el
 * canal webhook de NOTIFICATION — el backend delega en {@code HttpRequestSupport}. En DB la tabla destino es
 * fija ({@code inbound_routed_transaction}) y no es configurable.
 */
export interface Mt101InboundDeliverTaskDraft extends ProcessTaskRuntimeDraft, HttpRequestDraft {
  transport: Mt101InboundDeliverTransport;
  pageSize: number;
}

/** Tabla de negocio fija a la que el backend entrega el inbound ruteado (transporte DB). Solo informativa. */
export const MT101_INBOUND_DELIVER_DB_TABLE = 'inbound_routed_transaction';
const DEFAULT_PAGE_SIZE = 500;
const DEFAULT_TIMEOUT = 15;

/**
 * Provider del task type {@code MT101_INBOUND_DELIVER}: sink final del inbound (entrega los MT101 ruteados a
 * la tabla de negocio fija por DB, o a un endpoint REST con auth/login). Ya NO reusa el form de MT101_PAY.
 */
@Injectable()
export class Mt101InboundDeliverTaskProvider extends ProcessTaskProvider<Mt101InboundDeliverTaskDraft> {
  readonly descriptor: ProcessTaskProviderDescriptor = {
    type: 'MT101_INBOUND_DELIVER' as const,
    labelKey: 'processTask.MT101_INBOUND_DELIVER',
    descriptionKey: 'processTaskDescription.MT101_INBOUND_DELIVER',
    modalLayout: 'workspace' as const,
  };

  createDraft(): Mt101InboundDeliverTaskDraft {
    return {
      ...createHttpRequestDraft('POST', String(DEFAULT_TIMEOUT)),
      taskRef: '',
      executionMode: 'once',
      transport: 'DB',
      pageSize: DEFAULT_PAGE_SIZE,
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): Mt101InboundDeliverTaskDraft {
    const config: Record<string, any> = this.parseJson(task.configurationJson);
    const runtime = this.hydrateRuntime(task, 'once');
    return {
      ...hydrateHttpRequest(config, DEFAULT_TIMEOUT),
      ...runtime,
      transport: this.normalizeTransport(config['transport']),
      pageSize: Number(config['pageSize']) || DEFAULT_PAGE_SIZE,
    };
  }

  toTaskPatch(draft: Mt101InboundDeliverTaskDraft): Partial<ProcessTaskFormModel> {
    const payload: Record<string, any> = this.withRuntime(
      { transport: draft.transport, pageSize: draft.pageSize },
      draft,
      'once',
    );
    // El slice HTTP (url/method/auth/login/headers) solo aplica —y se persiste— en transporte REST; en DB la
    // tabla destino es fija y el backend ignora el HTTP.
    if (draft.transport === 'REST') {
      applyHttpRequestToPayload(draft, payload, DEFAULT_TIMEOUT);
    }
    return { configurationJson: this.toPrettyJson(payload) };
  }

  override summarize(task: ProcessTaskFormModel, _ctx: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    const target = config.transport === 'REST' ? (config.url || 'REST') : MT101_INBOUND_DELIVER_DB_TABLE;
    return [i18n.t(this.descriptor.labelKey), `${config.transport} -> ${target}`].join(' | ');
  }

  private normalizeTransport(value: unknown): Mt101InboundDeliverTransport {
    return String(value ?? 'DB').toUpperCase() === 'REST' ? 'REST' : 'DB';
  }
}
