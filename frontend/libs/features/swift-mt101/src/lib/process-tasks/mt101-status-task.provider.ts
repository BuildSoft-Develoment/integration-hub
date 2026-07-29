// @trace spec 008-mensajeria-pagos RF-005, T-013
// @trace ADR-009
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/i18n';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '@integration-hub/core/providers';
import { ProcessTaskRuntimeDraft } from '@integration-hub/core/providers';
import { ProcessTaskFormModel } from '@integration-hub/core/providers';

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
  /** STATUS por ruta: cada banco/ruta con su propio endpoint o su propio ACK por SFTP. */
  routeQuery: Mt101StatusRouteDraft[];
}

/**
 * Una entrada de `routeQuery`. El formulario gobierna lo que el operador necesita ver —a que banco se
 * consulta y como se clasifica su respuesta— y transporta el resto en `rest`.
 *
 * <p>Esa bolsa no es opcional: el backend lee mas claves por ruta de las que el form expone
 * (`method`, `timeoutSeconds`, `statusField`, `referenceField`...). Modelar unas pocas y reconstruir el
 * objeto desde cero borraria las demas — el mismo fallo que ya costo `resolveNormalPay` e
 * `input.filters`.</p>
 */
export interface Mt101StatusRouteDraft {
  /** Nombre de la ruta tal como la marca MT101_ROUTE (`routed_as`). */
  route: string;
  transport: 'REST' | 'SFTP';
  /** REST: endpoint de consulta de esa ruta. */
  url: string;
  /** SFTP: fuente OUTPUT/BOTH con la conexion del banco (ADR-017). Vacio = conexion inline heredada. */
  sinkRef: string;
  /** SFTP: ruta del archivo ACK/NACK que deja el banco. */
  responseFileTemplate: string;
  /** SFTP: tokens que clasifican la respuesta, separados por coma. */
  acceptedTokens: string;
  rejectedTokens: string;
  /** Claves de la ruta que el formulario no gobierna (incluido el bloque `sftp` inline). */
  rest: Record<string, unknown>;
}

/** Claves de una entrada de routeQuery que el formulario SI gobierna; el resto viaja en `rest`. */
const ROUTE_GOVERNED_KEYS = [
  'transport',
  'url',
  'responseFileTemplate',
  'acceptedTokens',
  'rejectedTokens',
] as const;

/**
 * Claves de primer nivel que ESTE formulario gobierna. Todo lo demas que traiga la configuracion
 * —`poll`, `callback`, `routeQuery`, `resolveCorrectivePay`, `acceptedStatuses`…— lo preserva la clase
 * base verbatim.
 *
 * <p>Antes esto era al reves: una lista blanca de las 14 claves NO gobernadas, que solo protegia lo
 * que alguien se habia acordado de anotar. La declaracion se invirtio porque enumerar lo propio es
 * finito y verificable —el trinquete comprueba que toda clave emitida este aca— mientras que
 * enumerar lo ajeno es una apuesta contra el backend: la clave que nadie anticipo es justo la que se
 * perdia.</p>
 */
const GOVERNED_KEYS = [
  'mode',
  'query',
  'expectedGatewayResponse',
  'connectionRef',
  'confirmationTable',
  'resolveNormalPay',
  'resolvesPayTaskRef',
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
    presentation: { icon: 'clock' as const, toneClass: 'ih-tone-payment' },
    nodePresentation: {
      badge: 'STATUS',
      toneClass: 'task-node--payment-status',
      iconPath: 'M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
    },
    summaryFields: ['updatedCount', 'pendingCount'],
    labelKey: 'processTask.MT101_STATUS',
    descriptionKey: 'processTaskDescription.MT101_STATUS',
    category: 'swift-mt101',
    availableOutputs: ['metadata', 'summary', 'records', 'errors'] as const,
    defaultOutput: 'records' as const,
    recordFields: ['sendersReference', 'status', 'gatewayReference', 'lastUpdatedAt'] as const,
    modalLayout: 'workspace' as const,
  };

  override get governedKeys(): readonly string[] {
    return GOVERNED_KEYS;
  }

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
      routeQuery: [],
    };
  }

  /** `routeQuery` es un objeto {ruta -> config}; el formulario lo maneja como lista ordenable. */
  private hydrateRouteQuery(raw: unknown): Mt101StatusRouteDraft[] {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return [];
    }
    return Object.entries(raw as Record<string, unknown>).map(([route, value]) => {
      const entry = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
      const sftp = (entry['sftp'] && typeof entry['sftp'] === 'object' ? entry['sftp'] : {}) as Record<string, unknown>;
      return {
        route,
        transport: String(entry['transport'] ?? 'REST').toUpperCase() === 'SFTP' ? 'SFTP' : 'REST',
        url: String(entry['url'] ?? ''),
        sinkRef: sftp['sinkRef'] == null ? '' : String(sftp['sinkRef']),
        responseFileTemplate: String(entry['responseFileTemplate'] ?? ''),
        acceptedTokens: this.tokensToText(entry['acceptedTokens']),
        rejectedTokens: this.tokensToText(entry['rejectedTokens']),
        // Todo lo demas viaja verbatim. El bloque `sftp` se saca aparte porque el form gobierna SOLO su
        // `sinkRef`: si la ruta trae una conexion INLINE (host/credenciales, sin sinkRef) hay que
        // conservarla entera o guardar desde la UI dejaria al STATUS sin a donde consultar.
        rest: {
          ...this.omitKeys(entry, [...ROUTE_GOVERNED_KEYS, 'sftp']),
          ...(sftp['sinkRef'] == null && Object.keys(sftp).length > 0 ? { __inlineSftp: sftp } : {}),
        },
      } satisfies Mt101StatusRouteDraft;
    });
  }

  private serializeRouteQuery(routes: readonly Mt101StatusRouteDraft[]): Record<string, unknown> | undefined {
    const named = routes.filter((route) => route.route.trim());
    if (named.length === 0) {
      // Ausente != vacio: `routeQuery: {}` apagaria el modo route-aware en el backend.
      return undefined;
    }
    const result: Record<string, unknown> = {};
    for (const route of named) {
      const inlineSftp = (route.rest['__inlineSftp'] ?? undefined) as Record<string, unknown> | undefined;
      const entry: Record<string, unknown> = this.omitKeys(route.rest, ['__inlineSftp']);
      // Se emite lo MINIMO. Añadir claves es tan riesgoso como perderlas: una ruta que solo traia su
      // bloque `sftp` volveria del editor con `transport` y `url:''` que nadie escribio, y el operador
      // no tiene como saber si eso cambia a que endpoint se consulta.
      if (route.transport === 'SFTP') {
        entry['transport'] = 'SFTP';
        if (route.responseFileTemplate.trim()) entry['responseFileTemplate'] = route.responseFileTemplate;
        if (route.acceptedTokens.trim()) entry['acceptedTokens'] = this.textToTokens(route.acceptedTokens);
        if (route.rejectedTokens.trim()) entry['rejectedTokens'] = this.textToTokens(route.rejectedTokens);
      } else if (route.url.trim()) {
        entry['url'] = route.url;
      }
      // El bloque de conexion se re-emite en AMBAS ramas. Solo en la de SFTP se perderia lo evidente;
      // el caso silencioso es una ruta con `sftp` inline y sin `transport` declarado —que el backend
      // trata como REST— donde guardar desde la UI borraba host y credenciales del banco.
      if (route.sinkRef.trim()) {
        entry['sftp'] = { sinkRef: Number(route.sinkRef) };
      } else if (inlineSftp) {
        entry['sftp'] = inlineSftp;
      }
      result[route.route.trim()] = entry;
    }
    return result;
  }

  private tokensToText(raw: unknown): string {
    return Array.isArray(raw) ? raw.map((token) => String(token)).join(', ') : String(raw ?? '');
  }

  private textToTokens(text: string): string[] {
    return text.split(',').map((token) => token.trim()).filter(Boolean);
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
      routeQuery: this.hydrateRouteQuery(config['routeQuery']),
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

  toTaskPatch(draft: Mt101StatusTaskDraft): Partial<ProcessTaskFormModel> {
    const routeQuery = this.serializeRouteQuery(draft.routeQuery);
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
        // Route-aware: solo se emite si hay rutas con nombre (ver serializeRouteQuery).
        ...(routeQuery ? { routeQuery } : {}),
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
