// @trace RF-002 (procesos: contrato configuration_json de tarea tipo REST_CALL)
import { Injectable } from '@angular/core';
import { ProcessTaskBodyFieldBindingDraft, ProcessTaskRuntimeDraft } from '../../tasks/process-task-binding.models';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

export interface RestCallTaskDraft extends ProcessTaskRuntimeDraft {
  mode: string;
  method: string;
  baseUrl: string;
  pathTemplate: string;
  url: string;
  pathParameters: ProcessTaskBodyFieldBindingDraft[];
  queryParameters: ProcessTaskBodyFieldBindingDraft[];
  headerMappings: ProcessTaskBodyFieldBindingDraft[];
  bodyTemplate: string;
  bodyMappings: ProcessTaskBodyFieldBindingDraft[];
  timeoutSeconds: string;
  authType: string;
  username: string;
  password: string;
  token: string;
  headersJson: string;
  loginUrl: string;
  loginMethod: string;
  loginHeadersJson: string;
  loginBodyTemplate: string;
  tokenPath: string;
}

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
      taskRef: '',
      executionMode: 'per-record',
      mode: 'per-record',
      method: 'POST',
      baseUrl: '',
      pathTemplate: '',
      url: '',
      pathParameters: [],
      queryParameters: [],
      headerMappings: [],
      bodyTemplate: '',
      bodyMappings: [],
      timeoutSeconds: '20',
      authType: '',
      username: '',
      password: '',
      token: '',
      headersJson: '{}',
      loginUrl: '',
      loginMethod: 'POST',
      loginHeadersJson: '{}',
      loginBodyTemplate: '',
      tokenPath: '$.access_token',
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): RestCallTaskDraft {
    const config: any = this.parseJson(task.configurationJson);
    const normalizedUrl = String(config.url || '');
    const parsedUrl = this.parseUrl(normalizedUrl);
    const pathParameters = this.normalizeBindings(config.pathParameters);
    const normalizedPathParameters = pathParameters.length ? pathParameters : this.parsePathSegments(String(config.pathTemplate || parsedUrl.pathTemplate));
    const queryParameters = this.normalizeBindings(config.queryParameters);
    const headerMappings = this.normalizeBindings(config.headerMappings, config.headers);
    return {
      ...this.hydrateRuntime(task, 'per-record'),
      mode: String(config.executionMode || config.mode || 'per-record'),
      method: String(config.method || 'POST'),
      baseUrl: String(config.baseUrl || parsedUrl.baseUrl),
      pathTemplate: String(config.pathTemplate || parsedUrl.pathTemplate),
      url: normalizedUrl,
      pathParameters: normalizedPathParameters,
      queryParameters: queryParameters.length ? queryParameters : parsedUrl.queryParameters,
      headerMappings,
      bodyTemplate: String(config.bodyTemplate || ''),
      bodyMappings: [],
      timeoutSeconds: String(config.timeoutSeconds ?? 20),
      authType: String(config.authType || ''),
      username: String(config.username || ''),
      password: String(config.password || ''),
      token: String(config.token || ''),
      headersJson: JSON.stringify(config.headers || {}, null, 2),
      loginUrl: String(config.loginUrl || ''),
      loginMethod: String(config.loginMethod || 'POST'),
      loginHeadersJson: JSON.stringify(config.loginHeaders || {}, null, 2),
      loginBodyTemplate: String(config.loginBodyTemplate || ''),
      tokenPath: String(config.tokenPath || '$.access_token'),
    };
  }

  toTaskPatch(draft: RestCallTaskDraft): Partial<ProcessTaskFormModel> {
    const pathTemplate = this.buildPathTemplate(draft.pathParameters);
    const url = this.buildUrl(draft.baseUrl, pathTemplate, draft.queryParameters);
    const executionMode = draft.executionMode || (draft.mode === 'single-request' ? 'once' : draft.mode) || 'per-record';
    const payload: any = this.withRuntime({
      mode: executionMode,
      method: draft.method || 'POST',
      baseUrl: draft.baseUrl || '',
      pathTemplate,
      url,
      timeoutSeconds: Number(draft.timeoutSeconds || 20),
    }, { ...draft, executionMode }, 'per-record');
    if (draft.pathParameters.length) payload.pathParameters = this.serializeBindings(draft.pathParameters);
    if (draft.queryParameters.length) payload.queryParameters = this.serializeBindings(draft.queryParameters);
    if (draft.headerMappings.length) {
      payload.headerMappings = this.serializeBindings(draft.headerMappings);
      payload.headers = this.bindingsToHeaders(draft.headerMappings);
    }
    if (draft.bodyTemplate) payload.bodyTemplate = draft.bodyTemplate;
    if (draft.authType) payload.authType = draft.authType;
    if (draft.authType === 'basic' && draft.username) payload.username = draft.username;
    if (draft.authType === 'basic' && draft.password) payload.password = draft.password;
    if (draft.authType === 'bearer' && draft.token) payload.token = draft.token;
    if (draft.authType === 'login-request') {
      if (draft.loginUrl) payload.loginUrl = draft.loginUrl;
      if (draft.loginMethod) payload.loginMethod = draft.loginMethod;
      if (draft.loginBodyTemplate) payload.loginBodyTemplate = draft.loginBodyTemplate;
      if (draft.tokenPath) payload.tokenPath = draft.tokenPath;
      const loginHeaders = this.parseJson(draft.loginHeadersJson);
      if (Object.keys(loginHeaders).length) payload.loginHeaders = loginHeaders;
    }
    return { configurationJson: this.toPrettyJson(payload) };
  }

  override summarize(task: ProcessTaskFormModel, _context: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    const target = [config.method, config.url || this.buildUrl(config.baseUrl, config.pathTemplate, config.queryParameters)].filter(Boolean).join(' ');
    return [i18n.t(this.descriptor.labelKey), target && i18n.t('ui.taskSummary.rest', { value: target })]
      .filter(Boolean)
      .join(' | ');
  }

  private normalizeBindings(bindings: any, fallbackMap?: Record<string, unknown>): ProcessTaskBodyFieldBindingDraft[] {
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

  private serializeBindings(bindings: ProcessTaskBodyFieldBindingDraft[]): any[] {
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

  private bindingsToHeaders(bindings: ProcessTaskBodyFieldBindingDraft[]): Record<string, string> {
    return bindings.reduce<Record<string, string>>((accumulator, item) => {
      const name = item.name?.trim();
      if (!name) {
        return accumulator;
      }
      const value = item.expression?.trim() || this.bindingToken(item);
      if (value) {
        accumulator[name] = value;
      }
      return accumulator;
    }, {});
  }

  private buildUrl(baseUrl: string, pathTemplate: string, queryParameters: ProcessTaskBodyFieldBindingDraft[]): string {
    const normalizedBase = String(baseUrl || '').trim().replace(/\/+$/, '');
    const normalizedPath = String(pathTemplate || '').trim();
    const path = normalizedPath
      ? normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`
      : '';
    const query = queryParameters
      .filter((item) => item.name?.trim())
      .map((item) => `${item.name.trim()}=${item.expression?.trim() || this.bindingToken(item)}`)
      .join('&');
    return `${normalizedBase}${path}${query ? `?${query}` : ''}`;
  }

  private bindingToken(item: ProcessTaskBodyFieldBindingDraft): string {
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

  private parseUrl(url: string): { baseUrl: string; pathTemplate: string; queryParameters: ProcessTaskBodyFieldBindingDraft[] } {
    const normalized = String(url || '').trim();
    if (!normalized) {
      return { baseUrl: '', pathTemplate: '', queryParameters: [] };
    }
    try {
      const parsed = new URL(normalized);
      const queryParameters: ProcessTaskBodyFieldBindingDraft[] = [];
      parsed.searchParams.forEach((value, name) => {
        queryParameters.push({
          name,
          sourceKind: 'expression',
          sourceKey: '',
          sourceLabel: '',
          expression: value,
        });
      });
      return {
        baseUrl: parsed.origin,
        pathTemplate: parsed.pathname,
        queryParameters,
      };
    } catch {
      return { baseUrl: '', pathTemplate: normalized, queryParameters: [] };
    }
  }

  private parsePathSegments(pathTemplate: string): ProcessTaskBodyFieldBindingDraft[] {
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

  private buildPathTemplate(segments: readonly ProcessTaskBodyFieldBindingDraft[]): string {
    const normalized = segments
      .map((segment) => segment.expression?.trim() || this.bindingToken(segment))
      .filter(Boolean)
      .join('/');
    return normalized ? `/${normalized}` : '';
  }
}
