import { Injectable } from '@angular/core';
import { SourceDraft, SourceProvider } from '../../sources/source-provider.abstract';

@Injectable()
export class RestSourceProvider extends SourceProvider {
  override readonly descriptor = {
    type: 'REST',
    label: 'REST',
    description:
      'Consume endpoints HTTP para descargar archivos o payloads y convertirlos en una fuente operativa.',
    category: 'API',
    capabilities: ['Bearer o basic auth', 'Headers dinamicos', 'Timeout y body configurables'],
    supportsConnectionSecret: true,
  } as const;

  override createDraft(): SourceDraft {
    return {
      ...super.createDraft(),
      connectionKind: 'rest',
      url: '',
      method: 'GET',
      authType: '',
      username: '',
      password: '',
      token: '',
      fileName: '',
      mediaType: '',
      timeoutSeconds: '20',
      headersJson: '{}',
      body: '',
    };
  }

  protected override hydrateDraftFromObject(configuration: Record<string, unknown>): SourceDraft {
    const defaults = this.createDraft();

    return {
      ...defaults,
      url: String(configuration['url'] ?? ''),
      method: (configuration['method'] as SourceDraft['method']) ?? defaults.method,
      authType: (configuration['authType'] as SourceDraft['authType']) ?? '',
      username: String(configuration['username'] ?? ''),
      password: String(configuration['password'] ?? ''),
      token: String(configuration['token'] ?? ''),
      fileName: String(configuration['fileName'] ?? ''),
      mediaType: String(configuration['mediaType'] ?? ''),
      timeoutSeconds: String(configuration['timeoutSeconds'] ?? defaults.timeoutSeconds ?? '20'),
      headersJson: JSON.stringify(configuration['headers'] ?? {}, null, 2),
      body: String(configuration['body'] ?? ''),
    };
  }

  protected override toConfigurationObject(draft: SourceDraft): Record<string, unknown> {
    let headers: Record<string, unknown> = {};

    try {
      headers = JSON.parse(draft.headersJson || '{}') as Record<string, unknown>;
    } catch {
      headers = {};
    }

    return {
      url: draft.url || '',
      method: draft.method || 'GET',
      ...(draft.authType ? { authType: draft.authType } : {}),
      ...(draft.authType === 'basic' && draft.username ? { username: draft.username } : {}),
      ...(draft.authType === 'basic' && draft.password ? { password: draft.password } : {}),
      ...(draft.authType === 'bearer' && draft.token ? { token: draft.token } : {}),
      ...(draft.fileName ? { fileName: draft.fileName } : {}),
      ...(draft.mediaType ? { mediaType: draft.mediaType } : {}),
      timeoutSeconds: Number(draft.timeoutSeconds || 20),
      ...(Object.keys(headers).length ? { headers } : {}),
      ...(draft.body ? { body: draft.body } : {}),
    };
  }
}
