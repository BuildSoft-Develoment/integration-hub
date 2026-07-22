import { Injectable } from '@angular/core';
import { ProcessTaskProvider, ProcessTaskProviderDescriptor, ProcessTaskSummaryContext } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskRuntimeDraft } from '../../tasks/process-task-binding.models';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';
import { I18nService } from '@integration-hub/core/i18n';

export type Mt101InboundDeliverTransport = 'DB' | 'REST';

/** Config REST del sink inbound (lo que lee el backend: url + contentType + timeoutSeconds). */
export interface Mt101InboundDeliverRestDraft {
  url: string;
  contentType: string;
  timeoutSeconds: number;
}

/**
 * Draft de MT101_INBOUND_DELIVER. Refleja EXACTAMENTE lo que lee el backend
 * ({@code Mt101InboundDeliverTaskProvider.execute}): transporte DB/REST + pageSize (+ rest si REST).
 * NO comparte los campos de MT101_PAY (SFTP/idempotencia/reintentos/confirmacion) porque el backend inbound
 * los ignora. La tabla destino de DB es fija ({@code inbound_routed_transaction}) y no es configurable.
 */
export interface Mt101InboundDeliverTaskDraft extends ProcessTaskRuntimeDraft {
  transport: Mt101InboundDeliverTransport;
  pageSize: number;
  rest: Mt101InboundDeliverRestDraft;
}

/** Tabla de negocio fija a la que el backend entrega el inbound ruteado (transporte DB). Solo informativa. */
export const MT101_INBOUND_DELIVER_DB_TABLE = 'inbound_routed_transaction';
const DEFAULT_PAGE_SIZE = 500;

/**
 * Provider del task type {@code MT101_INBOUND_DELIVER}: sink final del inbound (entrega los MT101 ruteados a
 * la tabla de negocio fija por DB, o a un endpoint REST). Ya NO reusa el form de MT101_PAY (aquel mostraba
 * campos que el backend inbound ignora); tiene su propio draft alineado al backend.
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
      taskRef: '',
      executionMode: 'once',
      transport: 'DB',
      pageSize: DEFAULT_PAGE_SIZE,
      rest: { url: '', contentType: 'application/json', timeoutSeconds: 15 },
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): Mt101InboundDeliverTaskDraft {
    const config: Record<string, any> = this.parseJson(task.configurationJson);
    const runtime = this.hydrateRuntime(task, 'once');
    const rest = (config['rest'] || {}) as Record<string, any>;
    return {
      ...runtime,
      transport: this.normalizeTransport(config['transport']),
      pageSize: Number(config['pageSize']) || DEFAULT_PAGE_SIZE,
      rest: {
        url: String(rest['url'] || ''),
        contentType: String(rest['contentType'] || 'application/json'),
        timeoutSeconds: Number(rest['timeoutSeconds']) || 15,
      },
    };
  }

  toTaskPatch(draft: Mt101InboundDeliverTaskDraft): Partial<ProcessTaskFormModel> {
    const payload: Record<string, unknown> = this.withRuntime(
      {
        transport: draft.transport,
        pageSize: draft.pageSize,
        // El backend solo lee `rest` cuando transport=REST; en DB no se persiste (la tabla es fija).
        ...(draft.transport === 'REST'
          ? {
              rest: {
                url: draft.rest.url,
                contentType: draft.rest.contentType,
                timeoutSeconds: draft.rest.timeoutSeconds,
              },
            }
          : {}),
      },
      draft,
      'once',
    );
    return { configurationJson: this.toPrettyJson(payload) };
  }

  override summarize(task: ProcessTaskFormModel, _ctx: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    const target = config.transport === 'REST' ? (config.rest.url || 'REST') : MT101_INBOUND_DELIVER_DB_TABLE;
    return [i18n.t(this.descriptor.labelKey), `${config.transport} -> ${target}`].join(' | ');
  }

  private normalizeTransport(value: unknown): Mt101InboundDeliverTransport {
    return String(value ?? 'DB').toUpperCase() === 'REST' ? 'REST' : 'DB';
  }
}
