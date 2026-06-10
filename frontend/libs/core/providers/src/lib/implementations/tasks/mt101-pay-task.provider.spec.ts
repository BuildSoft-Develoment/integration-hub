import { describe, expect, it } from 'vitest';
import { Mt101PayTaskDraft, Mt101PayTaskProvider } from './mt101-pay-task.provider';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

const baseTask: ProcessTaskFormModel = {
  clientId: 'client-1',
  id: null,
  taskOrder: 5,
  taskType: 'MT101_PAY',
  active: true,
  sourceDefinitionId: null,
  readerDefinitionId: null,
  configurationJson: '{}',
};

describe('Mt101PayTaskProvider', () => {
  it('declares MT101_PAY with workspace layout', () => {
    const provider = new Mt101PayTaskProvider();
    expect(provider.descriptor.type).toBe('MT101_PAY');
    expect(provider.descriptor.modalLayout).toBe('workspace');
  });

  it('createDraft returns sensible defaults for REST', () => {
    const draft = new Mt101PayTaskProvider().createDraft();
    expect(draft.executionMode).toBe('per-record');
    expect(draft.transport).toBe('REST');
    expect(draft.rest.method).toBe('POST');
    expect(draft.rest.extraHeadersJson).toBe('');
    expect(draft.rest.loginHeadersJson).toBe('');
    expect(draft.idempotencyKeyTemplate).toBe('${sendersReference}');
    expect(draft.retryPolicy.maxRetries).toBe(5);
    expect(draft.confirmationMode).toBe('sync');
  });

  it('serializes REST transport with bearer auth', () => {
    const provider = new Mt101PayTaskProvider();
    const draft: Mt101PayTaskDraft = {
      ...provider.createDraft(),
      taskRef: 'pay-mt101',
      rest: {
        ...provider.createDraft().rest,
        url: 'https://gateway.banco.local/v1/swift/mt101',
        authType: 'bearer',
        token: '${secret:gateway_token}',
      },
    };
    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(config.transport).toBe('REST');
    expect(config.rest.url).toBe('https://gateway.banco.local/v1/swift/mt101');
    expect(config.rest.authType).toBe('bearer');
    expect(config.rest.token).toBe('${secret:gateway_token}');
    expect(config.rest.loginUrl).toBeUndefined();
    expect(config.rest.tokenPath).toBeUndefined();
  });

  it('serializes REST transport with login-request auth', () => {
    const provider = new Mt101PayTaskProvider();
    const draft: Mt101PayTaskDraft = {
      ...provider.createDraft(),
      taskRef: 'pay-mt101',
      rest: {
        ...provider.createDraft().rest,
        url: 'https://gateway.banco.local/v1/swift/mt101',
        authType: 'login-request',
        loginUrl: 'https://auth.banco.local/oauth/token',
        loginHeadersJson: '{ "X-Api-Key": "key-123" }',
        loginBodyTemplate: 'grant_type=client_credentials&client_id=${secret:cid}',
        tokenPath: '$.access_token',
        extraHeadersJson: '{ "X-Origin": "integration-hub" }',
      },
    };
    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(config.rest.loginUrl).toBe('https://auth.banco.local/oauth/token');
    expect(config.rest.loginHeaders).toEqual({ 'X-Api-Key': 'key-123' });
    expect(config.rest.loginBodyTemplate).toContain('grant_type=client_credentials');
    expect(config.rest.tokenPath).toBe('$.access_token');
    expect(config.rest.extraHeaders).toEqual({ 'X-Origin': 'integration-hub' });
    expect(config.rest.token).toBeUndefined();
  });

  it('parses retryOn from comma-separated string to array', () => {
    const provider = new Mt101PayTaskProvider();
    const draft: Mt101PayTaskDraft = {
      ...provider.createDraft(),
      taskRef: 'p',
      rest: { ...provider.createDraft().rest, url: 'https://x' },
      retryPolicy: {
        ...provider.createDraft().retryPolicy,
        retryOnFamilies: 'TIMEOUT, 5xx ,CONNECTION_REFUSED',
      },
    };
    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(config.retryPolicy.retryOn).toEqual(['TIMEOUT', '5xx', 'CONNECTION_REFUSED']);
  });

  it('roundtrip preserves all REST fields and retry policy', () => {
    const provider = new Mt101PayTaskProvider();
    const initial: Mt101PayTaskDraft = {
      ...provider.createDraft(),
      taskRef: 'p1',
      transport: 'REST',
      rest: {
        url: 'https://gw',
        method: 'POST',
        authType: 'bearer',
        token: '${secret:t}',
        loginUrl: '',
        loginMethod: 'POST',
        loginHeadersJson: '',
        loginBodyTemplate: '',
        tokenPath: '$.access_token',
        extraHeadersJson: '{\n  "X-Origin": "integration-hub"\n}',
        contentType: 'application/json',
        timeoutSeconds: 30,
      },
      idempotencyKeyTemplate: 'X-${sendersReference}',
      retryPolicy: {
        maxRetries: 3,
        backoffStrategy: 'constant',
        initialBackoffSeconds: 10,
        maxBackoffSeconds: 60,
        retryOnFamilies: 'TIMEOUT,5xx',
      },
      confirmationMode: 'async-poll',
      expectedGatewayResponse: {
        successField: '$.ok',
        referenceField: '$.id',
        errorMessageField: '$.error',
      },
    };
    const patch = provider.toTaskPatch(initial);
    const rehydrated = provider.hydrateDraft({ ...baseTask, configurationJson: patch.configurationJson as string });
    expect(rehydrated).toEqual(initial);
  });

  it('hydrateDraft accepts retryOn as array OR as string', () => {
    const provider = new Mt101PayTaskProvider();
    const fromArray = provider.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({
        taskRef: 'p', executionMode: 'per-record', transport: 'REST',
        retryPolicy: { retryOn: ['5xx', 'TIMEOUT'] },
      }),
    });
    expect(fromArray.retryPolicy.retryOnFamilies).toBe('5xx,TIMEOUT');

    const fromString = provider.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({
        taskRef: 'p', executionMode: 'per-record', transport: 'REST',
        retryPolicy: { retryOn: '5xx,TIMEOUT' },
      }),
    });
    expect(fromString.retryPolicy.retryOnFamilies).toBe('5xx,TIMEOUT');
  });

  it('normalizes invalid enum values to safe defaults', () => {
    const provider = new Mt101PayTaskProvider();
    const draft = provider.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({
        taskRef: 'p', executionMode: 'per-record',
        transport: 'WHATEVER',
        confirmationMode: 'bogus',
        retryPolicy: { backoffStrategy: 'rocket' },
      }),
    });
    expect(draft.transport).toBe('REST');
    expect(draft.confirmationMode).toBe('sync');
    expect(draft.retryPolicy.backoffStrategy).toBe('exponential');
  });
});
