import { describe, expect, it } from 'vitest';
import { FileSystemSourceProvider } from './implementations/sources/file-system-source.provider';
import { RestSourceProvider } from './implementations/sources/rest-source.provider';

describe('Source providers', () => {
  it('serializes filesystem draft into backend-compatible JSON', () => {
    const provider = new FileSystemSourceProvider();

    const json = provider.toConfigurationJson({
      ...provider.createDraft(),
      path: 'C:/data/clientes',
      fileNameTemplate: 'clientes_{fecha}.csv',
      templateVariablesText: 'fecha=20260404',
      selectionMode: 'latestModified',
      fileErrorPolicy: 'continue',
      mediaType: 'text/csv',
    });

    expect(JSON.parse(json)).toEqual({
      path: 'C:/data/clientes',
      fileNameTemplate: 'clientes_{fecha}.csv',
      templateVariables: {
        fecha: '20260404',
      },
      selectionMode: 'latestModified',
      fileErrorPolicy: 'continue',
      mediaType: 'text/csv',
    });
  });

  it('hydrates rest source drafts from stored configuration', () => {
    const provider = new RestSourceProvider();

    const draft = provider.hydrateDraft(
      JSON.stringify({
        url: 'https://erp.local/api/report',
        method: 'POST',
        authType: 'bearer',
        token: '${secret:tasks/rest/notificacion1/password}',
        timeoutSeconds: 45,
        headers: {
          'X-Env': 'dev',
        },
        body: '{"query":"ok"}',
      })
    );

    expect(draft.url).toBe('https://erp.local/api/report');
    expect(draft.method).toBe('POST');
    expect(draft.authType).toBe('bearer');
    expect(draft.token).toBe('${secret:tasks/rest/notificacion1/password}');
    expect(draft.timeoutSeconds).toBe('45');
    expect(draft.headersJson).toContain('"X-Env"');
  });
});
