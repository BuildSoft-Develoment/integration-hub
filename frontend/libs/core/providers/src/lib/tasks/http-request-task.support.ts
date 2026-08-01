// @trace spec 003-diseno-y-ejecucion-procesos RF-002 (procesos: contrato HTTP comun REST_CALL + webhook NOTIFICATION) ADR-005
import { HttpRequestDraft, ProcessTaskBodyFieldBindingDraft } from './process-task-binding.models';

/**
 * (De)serializacion compartida de la peticion HTTP de una tarea de proceso.
 *
 * Centraliza el armado de `configuration_json` (metodo, baseUrl/path/query, headers,
 * autenticacion, body) que antes vivia duplicado en `RestCallTaskProvider`. Lo reutilizan
 * REST_CALL y el canal `webhook` de NOTIFICATION (ADR-005). Son funciones puras, sin DI.
 */

export function createHttpRequestDraft(defaultMethod = 'POST', defaultTimeout = '20'): HttpRequestDraft {
  return {
    method: defaultMethod,
    baseUrl: '',
    pathTemplate: '',
    url: '',
    pathParameters: [],
    queryParameters: [],
    headerMappings: [],
    bodyTemplate: '',
    timeoutSeconds: defaultTimeout,
    authType: '',
    username: '',
    password: '',
    token: '',
    loginUrl: '',
    loginMethod: 'POST',
    loginHeadersJson: '{}',
    loginBodyTemplate: '',
    tokenPath: '$.access_token',
  };
}

export function hydrateHttpRequest(config: any, defaultTimeout = 20): HttpRequestDraft {
  const normalizedUrl = String(config.url || '');
  const parsedUrl = parseUrl(normalizedUrl);
  const pathParameters = normalizeBindings(config.pathParameters);
  const normalizedPathParameters = pathParameters.length
    ? pathParameters
    : parsePathSegments(String(config.pathTemplate || parsedUrl.pathTemplate));
  const queryParameters = normalizeBindings(config.queryParameters);
  const headerMappings = normalizeBindings(config.headerMappings, config.headers);
  return {
    method: String(config.method || 'POST'),
    baseUrl: String(config.baseUrl || parsedUrl.baseUrl),
    pathTemplate: String(config.pathTemplate || parsedUrl.pathTemplate),
    url: normalizedUrl,
    pathParameters: normalizedPathParameters,
    queryParameters: queryParameters.length ? queryParameters : parsedUrl.queryParameters,
    headerMappings,
    bodyTemplate: String(config.bodyTemplate || ''),
    timeoutSeconds: String(config.timeoutSeconds ?? defaultTimeout),
    authType: String(config.authType || ''),
    username: String(config.username || ''),
    password: String(config.password || ''),
    token: String(config.token || ''),
    loginUrl: String(config.loginUrl || ''),
    loginMethod: String(config.loginMethod || 'POST'),
    loginHeadersJson: JSON.stringify(config.loginHeaders || {}, null, 2),
    loginBodyTemplate: String(config.loginBodyTemplate || ''),
    tokenPath: String(config.tokenPath || '$.access_token'),
  };
}

/**
 * Vuelca el slice HTTP del draft en el payload de `configuration_json` (mutando `payload`).
 * No incluye runtime (`taskRef`/`executionMode`/`input`): eso lo agrega el provider con
 * `withRuntime`. Devuelve el mismo payload por conveniencia.
 */
/**
 * Claves de primer nivel que escribe {@link applyHttpRequestToPayload}. Todo provider que use el
 * helper las gobierna, asi que las declara en su `governedKeys`: si quedaran fuera, apagar la
 * autenticacion o borrar un token desde la UI los resucitaria con su valor anterior.
 *
 * <p>Vive junto al helper y no copiada en cada provider para que agregar una clave al bloque HTTP
 * no obligue a acordarse de tres archivos.</p>
 */
export const HTTP_REQUEST_KEYS: readonly string[] = [
  'method',
  'baseUrl',
  'pathTemplate',
  'url',
  'queryParameters',
  'pathParameters',
  'headers',
  'headerMappings',
  'bodyTemplate',
  'timeoutSeconds',
  'authType',
  'username',
  'password',
  'token',
  'loginUrl',
  'loginMethod',
  'loginHeaders',
  'loginBodyTemplate',
  'tokenPath',
];

export function applyHttpRequestToPayload(
  draft: HttpRequestDraft,
  payload: Record<string, any>,
  defaultTimeout = 20,
): Record<string, any> {
  const pathTemplate = buildPathTemplate(draft.pathParameters);
  const url = buildUrl(draft.baseUrl, pathTemplate, draft.queryParameters);
  payload['method'] = draft.method || 'POST';
  payload['baseUrl'] = draft.baseUrl || '';
  payload['pathTemplate'] = pathTemplate;
  payload['url'] = url;
  payload['timeoutSeconds'] = Number(draft.timeoutSeconds || defaultTimeout);
  if (draft.pathParameters.length) {
    payload['pathParameters'] = serializeBindings(draft.pathParameters);
  }
  if (draft.queryParameters.length) {
    payload['queryParameters'] = serializeBindings(draft.queryParameters);
  }
  if (draft.headerMappings.length) {
    payload['headerMappings'] = serializeBindings(draft.headerMappings);
    payload['headers'] = bindingsToHeaders(draft.headerMappings);
  }
  if (draft.bodyTemplate) {
    payload['bodyTemplate'] = draft.bodyTemplate;
  }
  if (draft.authType) {
    payload['authType'] = draft.authType;
  }
  if (draft.authType === 'basic' && draft.username) {
    payload['username'] = draft.username;
  }
  if (draft.authType === 'basic' && draft.password) {
    payload['password'] = draft.password;
  }
  if (draft.authType === 'bearer' && draft.token) {
    payload['token'] = draft.token;
  }
  if (draft.authType === 'login-request') {
    if (draft.loginUrl) payload['loginUrl'] = draft.loginUrl;
    if (draft.loginMethod) payload['loginMethod'] = draft.loginMethod;
    if (draft.loginBodyTemplate) payload['loginBodyTemplate'] = draft.loginBodyTemplate;
    if (draft.tokenPath) payload['tokenPath'] = draft.tokenPath;
    const loginHeaders = parseJsonObject(draft.loginHeadersJson);
    if (Object.keys(loginHeaders).length) payload['loginHeaders'] = loginHeaders;
  }
  return payload;
}

/** Compone la URL final base + path + query para previsualizacion y para el backend. */
export function buildUrl(
  baseUrl: string,
  pathTemplate: string,
  queryParameters: readonly ProcessTaskBodyFieldBindingDraft[],
): string {
  const normalizedBase = String(baseUrl || '').trim().replace(/\/+$/, '');
  const normalizedPath = String(pathTemplate || '').trim();
  const path = normalizedPath ? (normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`) : '';
  const query = queryParameters
    .filter((item) => item.name?.trim())
    .map((item) => `${item.name.trim()}=${item.expression?.trim() || bindingToken(item)}`)
    .join('&');
  return `${normalizedBase}${path}${query ? `?${query}` : ''}`;
}

export function buildPathTemplate(segments: readonly ProcessTaskBodyFieldBindingDraft[]): string {
  const normalized = segments
    .map((segment) => segment.expression?.trim() || bindingToken(segment))
    .filter(Boolean)
    .join('/');
  return normalized ? `/${normalized}` : '';
}

export function bindingToken(item: ProcessTaskBodyFieldBindingDraft): string {
  if (!item.sourceKey?.trim()) {
    return '';
  }
  if (item.sourceKind === 'variable') {
    return `{${item.sourceKey.trim()}}`;
  }
  if (item.sourceKind && item.sourceKind !== 'expression') {
    return `{${item.sourceKey.trim()}}`;
  }
  return item.sourceKey.trim();
}

function serializeBindings(bindings: readonly ProcessTaskBodyFieldBindingDraft[]): any[] {
  return bindings
    .filter((item) => Boolean(item.name?.trim()))
    .map((item) => ({
      name: item.name.trim(),
      ...(item.expression?.trim()
        ? { expression: item.expression.trim(), sourceKind: 'expression' }
        : {
            value: item.sourceKey.trim(),
            sourceKind: item.sourceKind || 'field',
            sourceKey: item.sourceKey.trim(),
            sourceLabel: (item.sourceLabel || item.sourceKey).trim(),
          }),
    }));
}

function bindingsToHeaders(bindings: readonly ProcessTaskBodyFieldBindingDraft[]): Record<string, string> {
  return bindings.reduce<Record<string, string>>((accumulator, item) => {
    const name = item.name?.trim();
    if (!name) {
      return accumulator;
    }
    const value = item.expression?.trim() || bindingToken(item);
    if (value) {
      accumulator[name] = value;
    }
    return accumulator;
  }, {});
}

function normalizeBindings(bindings: any, fallbackMap?: Record<string, unknown>): ProcessTaskBodyFieldBindingDraft[] {
  if (Array.isArray(bindings)) {
    return bindings.map((item: any) => ({
      name: String(item?.name || ''),
      sourceKind: (String(item?.sourceKind || '') as any) || (item?.expression ? 'expression' : item?.value ? 'field' : null),
      sourceKey: String(item?.sourceKey || item?.value || ''),
      sourceLabel: String(item?.sourceLabel || item?.value || ''),
      expression: String(item?.expression || ''),
    }));
  }
  if (fallbackMap && typeof fallbackMap === 'object') {
    return Object.entries(fallbackMap).map(([name, value]) => ({
      name,
      sourceKind: 'expression',
      sourceKey: '',
      sourceLabel: '',
      expression: String(value ?? ''),
    }));
  }
  return [];
}

function parseUrl(url: string): { baseUrl: string; pathTemplate: string; queryParameters: ProcessTaskBodyFieldBindingDraft[] } {
  const normalized = String(url || '').trim();
  if (!normalized) {
    return { baseUrl: '', pathTemplate: '', queryParameters: [] };
  }
  try {
    const parsed = new URL(normalized);
    const queryParameters: ProcessTaskBodyFieldBindingDraft[] = [];
    parsed.searchParams.forEach((value, name) => {
      queryParameters.push({ name, sourceKind: 'expression', sourceKey: '', sourceLabel: '', expression: value });
    });
    return { baseUrl: parsed.origin, pathTemplate: parsed.pathname, queryParameters };
  } catch {
    return { baseUrl: '', pathTemplate: normalized, queryParameters: [] };
  }
}

function parsePathSegments(pathTemplate: string): ProcessTaskBodyFieldBindingDraft[] {
  const normalized = String(pathTemplate || '').trim().replace(/^\/+|\/+$/g, '');
  if (!normalized) {
    return [];
  }
  return normalized.split('/').map((segment) => {
    const value = segment.trim();
    const placeholder = value.match(/^\{(.+)\}$/);
    if (placeholder) {
      const token = placeholder[1].trim();
      return {
        name: '',
        sourceKind: token.startsWith('_') ? 'metadata' : 'field',
        sourceKey: token,
        sourceLabel: token,
        expression: '',
      } satisfies ProcessTaskBodyFieldBindingDraft;
    }
    return {
      name: '',
      sourceKind: 'expression',
      sourceKey: '',
      sourceLabel: '',
      expression: value,
    } satisfies ProcessTaskBodyFieldBindingDraft;
  });
}

function parseJsonObject(json: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(json || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
