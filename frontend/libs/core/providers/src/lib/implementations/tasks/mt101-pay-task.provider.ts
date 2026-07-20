// @trace spec 008-mensajeria-pagos RF-004, RF-016, T-009
// @trace ADR-009
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/i18n';
import { ProcessTaskProvider, ProcessTaskProviderDescriptor, ProcessTaskSummaryContext } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskRuntimeDraft } from '../../tasks/process-task-binding.models';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

export type Mt101PayTransport = 'REST' | 'SFTP';
export type Mt101PayAuthType = '' | 'bearer' | 'login-request';
export type Mt101PayConfirmationMode = 'sync' | 'async-callback' | 'async-poll';
export type Mt101PayBackoffStrategy = 'exponential' | 'constant';
export type Mt101PayDuplicatePolicy = 'SKIP_IF_SAME_HASH' | 'FAIL' | 'OVERWRITE' | 'RENAME_WITH_SUFFIX';

/**
 * Sub-draft del transporte SFTP (ADR-017). La CONEXION al banco se toma de una fuente {@code /sources} OUTPUT/BOTH
 * via {@code sinkRef} (el backend resuelve+congela host/credenciales); aqui solo se configura lo OPERACIONAL de la
 * entrega (ruta destino, extension temporal, politica de duplicado remoto).
 */
export interface Mt101PaySftpDraft {
  sinkRef: string;
  dropPathTemplate: string;
  tmpExtension: string;
  remoteDuplicatePolicy: Mt101PayDuplicatePolicy;
}

/** Sub-draft del transporte REST. */
export interface Mt101PayRestDraft {
  url: string;
  method: string;
  authType: Mt101PayAuthType;
  token: string;
  loginUrl: string;
  loginMethod: string;
  loginHeadersJson: string;
  loginBodyTemplate: string;
  tokenPath: string;
  extraHeadersJson: string;
  contentType: string;
  timeoutSeconds: number;
}

/** Politica de reintentos. */
export interface Mt101PayRetryPolicyDraft {
  maxRetries: number;
  backoffStrategy: Mt101PayBackoffStrategy;
  initialBackoffSeconds: number;
  maxBackoffSeconds: number;
  retryOnFamilies: string;
}

/** JSON-paths para parsear la respuesta del gateway. */
export interface Mt101PayExpectedResponseDraft {
  successField: string;
  referenceField: string;
  errorMessageField: string;
}

/** Draft del formulario MT101_PAY. */
export interface Mt101PayTaskDraft extends ProcessTaskRuntimeDraft {
  transport: Mt101PayTransport;
  rest: Mt101PayRestDraft;
  sftp: Mt101PaySftpDraft;
  idempotencyKeyTemplate: string;
  retryPolicy: Mt101PayRetryPolicyDraft;
  confirmationMode: Mt101PayConfirmationMode;
  expectedGatewayResponse: Mt101PayExpectedResponseDraft;
}

/**
 * Provider del task type {@code MT101_PAY}.
 *
 * <p>Slice actual cubre REST y SFTP. MQ no se expone en UI hasta que exista el
 * provider backend correspondiente.</p>
 */
@Injectable()
export class Mt101PayTaskProvider extends ProcessTaskProvider<Mt101PayTaskDraft> {
  readonly descriptor: ProcessTaskProviderDescriptor = {
    type: 'MT101_PAY' as const,
    labelKey: 'processTask.MT101_PAY',
    descriptionKey: 'processTaskDescription.MT101_PAY',
    modalLayout: 'workspace' as const,
  };

  createDraft(): Mt101PayTaskDraft {
    return {
      taskRef: '',
      executionMode: 'once',
      transport: 'REST',
      rest: {
        url: '',
        method: 'POST',
        authType: '',
        token: '',
        loginUrl: '',
        loginMethod: 'POST',
        loginHeadersJson: '',
        loginBodyTemplate: '',
        tokenPath: '$.access_token',
        extraHeadersJson: '',
        contentType: 'auto',
        timeoutSeconds: 60,
      },
      sftp: this.defaultSftp(),
      idempotencyKeyTemplate: '${sendersReference}',
      retryPolicy: {
        maxRetries: 5,
        backoffStrategy: 'exponential',
        initialBackoffSeconds: 30,
        maxBackoffSeconds: 900,
        retryOnFamilies: 'TIMEOUT,5xx,CONNECTION_REFUSED',
      },
      confirmationMode: 'sync',
      expectedGatewayResponse: {
        successField: '$.accepted',
        referenceField: '$.gatewayReference',
        errorMessageField: '$.error.message',
      },
    };
  }

  private defaultSftp(): Mt101PaySftpDraft {
    return {
      sinkRef: '',
      dropPathTemplate: '/inbox/${sendersReference}.fin',
      tmpExtension: '.part',
      remoteDuplicatePolicy: 'SKIP_IF_SAME_HASH',
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): Mt101PayTaskDraft {
    const config: Record<string, any> = this.parseJson(task.configurationJson);
    const runtime = this.hydrateRuntime(task, 'once');
    const rest = (config['rest'] || {}) as Record<string, any>;
    const sftp = (config['sftp'] || {}) as Record<string, any>;
    const retry = (config['retryPolicy'] || {}) as Record<string, any>;
    const expected = (config['expectedGatewayResponse'] || {}) as Record<string, any>;
    const defaultSftp = this.defaultSftp();
    return {
      ...runtime,
      transport: this.normalizeTransport(config['transport']),
      rest: {
        url: String(rest['url'] || ''),
        method: String(rest['method'] || 'POST'),
        authType: this.normalizeAuthType(rest['authType']),
        token: String(rest['token'] || ''),
        loginUrl: String(rest['loginUrl'] || ''),
        loginMethod: String(rest['loginMethod'] || 'POST'),
        loginHeadersJson: this.stringifyObject(rest['loginHeaders']),
        loginBodyTemplate: String(rest['loginBodyTemplate'] || ''),
        tokenPath: String(rest['tokenPath'] || '$.access_token'),
        extraHeadersJson: this.stringifyObject(rest['extraHeaders']),
        contentType: String(rest['contentType'] || 'auto'),
        timeoutSeconds: Number(rest['timeoutSeconds']) || 60,
      },
      sftp: {
        sinkRef: sftp['sinkRef'] == null ? '' : String(sftp['sinkRef']),
        dropPathTemplate: String(sftp['dropPathTemplate'] || defaultSftp.dropPathTemplate),
        tmpExtension: String(sftp['tmpExtension'] || defaultSftp.tmpExtension),
        remoteDuplicatePolicy: this.normalizeDuplicatePolicy(sftp['remoteDuplicatePolicy']),
      },
      idempotencyKeyTemplate: String(config['idempotencyKeyTemplate'] ?? '${sendersReference}'),
      retryPolicy: {
        maxRetries: Number(retry['maxRetries'] ?? 5),
        backoffStrategy: this.normalizeBackoffStrategy(retry['backoffStrategy']),
        initialBackoffSeconds: Number(retry['initialBackoffSeconds'] ?? 30),
        maxBackoffSeconds: Number(retry['maxBackoffSeconds'] ?? 900),
        retryOnFamilies: Array.isArray(retry['retryOn'])
          ? retry['retryOn'].join(',')
          : String(retry['retryOn'] || 'TIMEOUT,5xx,CONNECTION_REFUSED'),
      },
      confirmationMode: this.normalizeConfirmationMode(config['confirmationMode']),
      expectedGatewayResponse: {
        successField: String(expected['successField'] || '$.accepted'),
        referenceField: String(expected['referenceField'] || '$.gatewayReference'),
        errorMessageField: String(expected['errorMessageField'] || '$.error.message'),
      },
    };
  }

  toTaskPatch(draft: Mt101PayTaskDraft): Partial<ProcessTaskFormModel> {
    const restPayload = draft.transport === 'REST'
      ? this.compactObject({
          url: draft.rest.url,
          method: draft.rest.method,
          authType: draft.rest.authType || undefined,
          token: draft.rest.authType === 'bearer' ? draft.rest.token : undefined,
          loginUrl: draft.rest.authType === 'login-request' ? draft.rest.loginUrl : undefined,
          loginMethod: draft.rest.authType === 'login-request' ? draft.rest.loginMethod : undefined,
          loginHeaders: draft.rest.authType === 'login-request'
            ? this.parseObjectText(draft.rest.loginHeadersJson)
            : undefined,
          loginBodyTemplate:
            draft.rest.authType === 'login-request' ? draft.rest.loginBodyTemplate : undefined,
          tokenPath: draft.rest.authType === 'login-request' ? draft.rest.tokenPath : undefined,
          extraHeaders: this.parseObjectText(draft.rest.extraHeadersJson),
          contentType: draft.rest.contentType,
          timeoutSeconds: draft.rest.timeoutSeconds,
        })
      : undefined;

    // ADR-017: en SFTP la conexion se toma de una fuente OUTPUT/BOTH (sinkRef); solo se persiste lo operacional +
    // el sinkRef (numerico). El backend resuelve+congela host/credenciales desde la fuente. Sin transporte SFTP no
    // se emite el bloque.
    const sftpPayload = draft.transport === 'SFTP'
      ? this.compactObject({
          sinkRef: draft.sftp.sinkRef ? Number(draft.sftp.sinkRef) : undefined,
          dropPathTemplate: draft.sftp.dropPathTemplate,
          tmpExtension: draft.sftp.tmpExtension,
          remoteDuplicatePolicy: draft.sftp.remoteDuplicatePolicy,
        })
      : undefined;

    const retryOn = draft.retryPolicy.retryOnFamilies
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload: Record<string, unknown> = this.withRuntime(
      {
        transport: draft.transport,
        ...(restPayload ? { rest: restPayload } : {}),
        ...(sftpPayload ? { sftp: sftpPayload } : {}),
        idempotencyKeyTemplate: draft.idempotencyKeyTemplate,
        retryPolicy: {
          maxRetries: draft.retryPolicy.maxRetries,
          backoffStrategy: draft.retryPolicy.backoffStrategy,
          initialBackoffSeconds: draft.retryPolicy.initialBackoffSeconds,
          maxBackoffSeconds: draft.retryPolicy.maxBackoffSeconds,
          retryOn,
        },
        confirmationMode: draft.confirmationMode,
        expectedGatewayResponse: this.compactObject({
          successField: draft.expectedGatewayResponse.successField,
          referenceField: draft.expectedGatewayResponse.referenceField,
          errorMessageField: draft.expectedGatewayResponse.errorMessageField,
        }),
      },
      draft,
      'once',
    );
    return { configurationJson: this.toPrettyJson(this.compactObject(payload) as Record<string, unknown>) };
  }

  override summarize(task: ProcessTaskFormModel, _context: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    let target: string;
    if (config.transport === 'REST') {
      target = config.rest.url;
    } else if (config.transport === 'SFTP') {
      const sink = config.sftp.sinkRef ? `sink#${config.sftp.sinkRef}` : '';
      target = [sink, config.sftp.dropPathTemplate].filter((part) => part).join(' ');
    } else {
      target = config.transport;
    }
    return [i18n.t(this.descriptor.labelKey), `${config.transport} ${target || '?'}`].join(' | ');
  }

  // --- helpers ---

  private normalizeTransport(value: unknown): Mt101PayTransport {
    const v = String(value || 'REST').toUpperCase();
    return v === 'SFTP' ? 'SFTP' : 'REST';
  }

  private normalizeDuplicatePolicy(value: unknown): Mt101PayDuplicatePolicy {
    const v = String(value || 'SKIP_IF_SAME_HASH').toUpperCase();
    return v === 'FAIL' || v === 'OVERWRITE' || v === 'RENAME_WITH_SUFFIX'
      ? (v as Mt101PayDuplicatePolicy)
      : 'SKIP_IF_SAME_HASH';
  }

  private normalizeAuthType(value: unknown): Mt101PayAuthType {
    const v = String(value || '').toLowerCase();
    return v === 'bearer' || v === 'login-request' ? (v as Mt101PayAuthType) : '';
  }

  private normalizeConfirmationMode(value: unknown): Mt101PayConfirmationMode {
    const v = String(value || 'sync');
    return v === 'async-callback' || v === 'async-poll' ? (v as Mt101PayConfirmationMode) : 'sync';
  }

  private normalizeBackoffStrategy(value: unknown): Mt101PayBackoffStrategy {
    const v = String(value || 'exponential');
    return v === 'constant' ? 'constant' : 'exponential';
  }

  private compactObject<T extends Record<string, unknown>>(obj: T): T {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue;
      if (typeof value === 'string' && value === '') continue;
      if (Array.isArray(value) && value.length === 0) continue;
      if (typeof value === 'object' && !Array.isArray(value)) {
        const nested = this.compactObject(value as Record<string, unknown>);
        if (Object.keys(nested).length === 0) continue;
        out[key] = nested;
      } else {
        out[key] = value;
      }
    }
    return out as T;
  }

  private stringifyObject(value: unknown): string {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return '';
    }
    return JSON.stringify(value, null, 2);
  }

  private parseObjectText(value: string): Record<string, string> | undefined {
    if (!value || !value.trim()) {
      return undefined;
    }
    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return undefined;
      }
      return Object.entries(parsed).reduce<Record<string, string>>((accumulator, [key, entryValue]) => {
        accumulator[key] = String(entryValue ?? '');
        return accumulator;
      }, {});
    } catch {
      return undefined;
    }
  }
}
