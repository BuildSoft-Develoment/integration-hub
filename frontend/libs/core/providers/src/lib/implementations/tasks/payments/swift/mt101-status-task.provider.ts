// @trace spec 008-mensajeria-pagos RF-005, T-013
// @trace ADR-009
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/i18n';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../../../tasks/process-task-provider.abstract';
import { ProcessTaskRuntimeDraft } from '../../../../tasks/process-task-binding.models';
import { ProcessTaskFormModel } from '../../../../tasks/process-task.models';

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
  /** Conciliacion in-line del PAY normal (money-path). Gobernado por el formulario. */
  resolveNormalPay: boolean;
  /** taskRef del MT101_PAY que resuelve este STATUS; obligatorio en procesos multi-PAY. */
  resolvesPayTaskRef: string;
  /** Claves que el backend lee pero el formulario todavia no gobierna; viajan verbatim (ver PRESERVED_KEYS). */
  preserved: Record<string, unknown>;
}

/**
 * Claves de configuracion que el backend LEE pero el formulario aun no expone. Se transportan verbatim en el
 * draft para que un round-trip por la UI no las borre.
 *
 * <p>No se tipan con un default propio a proposito: varias son tri-estado o listas cuyo "ausente" tiene
 * semantica propia en el backend ({@code archiveStatusSync} default true, {@code correctivePayStatuses},
 * {@code acceptedStatuses}…). Inventarles un valor al serializar CAMBIARIA el comportamiento; copiarlas tal
 * cual lo preserva. Cuando el formulario pase a gobernar alguna, se saca de esta lista y se tipa arriba.</p>
 */
const PRESERVED_KEYS = [
  'acceptedStatuses',
  'archiveStatusSync',
  'archiveStatusTable',
  'callback',
  'correctivePayStatuses',
  'executedBy',
  'fragmentSetId',
  'maxRecordsInOutput',
  'pageSize',
  'poll',
  'reason',
  'rejectedStatuses',
  'resolveCorrectivePay',
  'routeQuery',
] as const;

/**
 * Provider del task type {@code MT101_STATUS}.
 *
 * <p>El backend implementa los TRES modos: {@code query} (single-shot por record), {@code poll} y
 * {@code callback} — estos dos suspenden la tarea ({@code Mt101StatusTaskProvider implements
 * SuspendableTaskProvider}) y por eso exigen {@code executionMode='once'}, igual que el camino
 * {@code resolveNormalPay}. El {@code query} simple si admite {@code per-record}/{@code batch}.</p>
 */
@Injectable()
export class Mt101StatusTaskProvider extends ProcessTaskProvider<Mt101StatusTaskDraft> {
  readonly descriptor = {
    type: 'MT101_STATUS' as const,
    summaryFields: ['updatedCount', 'pendingCount'],
    labelKey: 'processTask.MT101_STATUS',
    descriptionKey: 'processTaskDescription.MT101_STATUS',
    category: 'swift-mt101',
    availableOutputs: ['metadata', 'summary', 'records', 'errors'] as const,
    defaultOutput: 'records' as const,
    recordFields: ['sendersReference', 'status', 'gatewayReference', 'lastUpdatedAt'] as const,
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
      resolveNormalPay: false,
      resolvesPayTaskRef: '',
      preserved: {},
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
      resolveNormalPay: this.parseBackendBoolean(config['resolveNormalPay']),
      resolvesPayTaskRef: String(config['resolvesPayTaskRef'] || ''),
      preserved: this.readPreserved(config),
    };
  }

  /**
   * Espejo EXACTO de como el backend lee un booleano de la config:
   * {@code Boolean.parseBoolean(String.valueOf(raw))} (Mt101StatusTaskProvider.boolValue), o sea true solo
   * para "true" sin distinguir mayusculas — y acepta el STRING "true", no solo el booleano.
   *
   * <p>Un {@code === true} estricto aqui seria un bug silencioso: una config sembrada por API/seed con
   * {@code "resolveNormalPay": "true"} vale true para el backend, pero la UI la leeria como false y al guardar
   * la OMITIRIA, apagando la conciliacion in-line del money-path sin avisar.</p>
   */
  private parseBackendBoolean(raw: unknown): boolean {
    if (raw === null || raw === undefined) {
      return false;
    }
    return String(raw).trim().toLowerCase() === 'true';
  }

  /** Copia verbatim las claves de {@link PRESERVED_KEYS} presentes en el config (ausente sigue ausente). */
  private readPreserved(config: Record<string, any>): Record<string, unknown> {
    const preserved: Record<string, unknown> = {};
    PRESERVED_KEYS.forEach((key) => {
      if (config[key] !== undefined) {
        preserved[key] = config[key];
      }
    });
    return preserved;
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
        // Money-path: solo se emiten cuando estan activos, para no ensuciar la config de un STATUS que no
        // concilia (ausente == false en el backend). resolvesPayTaskRef solo tiene sentido con el flag ON.
        ...(draft.resolveNormalPay ? { resolveNormalPay: true } : {}),
        ...(draft.resolveNormalPay && draft.resolvesPayTaskRef
          ? { resolvesPayTaskRef: draft.resolvesPayTaskRef }
          : {}),
        // Claves que el formulario aun no gobierna: se re-emiten tal cual llegaron. Sin esto, editar cualquier
        // campo del form BORRABA poll/callback/routeQuery/resolveCorrectivePay y 10 mas.
        ...draft.preserved,
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
