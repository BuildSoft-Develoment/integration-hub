import { describe, expect, it } from 'vitest';
import { Mt101PayTaskDraft, Mt101PayTaskProvider } from './mt101-pay-task.provider';
import { ProcessTaskFormModel } from '@integration-hub/core/providers';

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
    expect(draft.executionMode).toBe('once');
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
    // `ungoverned` lo agrega la clase base: la bolsa de claves que este formulario no gobierna. Vacía
    // acá porque la config del caso solo trae claves gobernadas.
    expect(rehydrated).toEqual({ ...initial, ungoverned: {} });
  });

  it('serializes SFTP transport with sinkRef and operational fields (ADR-017)', () => {
    const provider = new Mt101PayTaskProvider();
    const draft: Mt101PayTaskDraft = {
      ...provider.createDraft(),
      taskRef: 'pay-sftp',
      transport: 'SFTP',
      sftp: {
        sinkRef: '11',
        dropPathTemplate: '/inbox/${sendersReference}.fin',
        tmpExtension: '.part',
        remoteDuplicatePolicy: 'FAIL',
      },
    };
    const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
    expect(config.transport).toBe('SFTP');
    expect(config.sftp.sinkRef).toBe(11); // se persiste numerico para el backend
    expect(config.sftp.dropPathTemplate).toBe('/inbox/${sendersReference}.fin');
    expect(config.sftp.tmpExtension).toBe('.part');
    expect(config.sftp.remoteDuplicatePolicy).toBe('FAIL');
    // no se filtra host/credenciales desde el front: el backend los resuelve desde el sinkRef
    expect(config.sftp.host).toBeUndefined();
    expect(config.sftp.password).toBeUndefined();
    // SFTP no emite el bloque REST
    expect(config.rest).toBeUndefined();
  });

  it('roundtrip preserves SFTP fields (ADR-017)', () => {
    const provider = new Mt101PayTaskProvider();
    const initial: Mt101PayTaskDraft = {
      ...provider.createDraft(),
      taskRef: 'p-sftp',
      transport: 'SFTP',
      sftp: {
        sinkRef: '11',
        dropPathTemplate: '/inbox/${uetr}.fin',
        tmpExtension: '.tmp',
        remoteDuplicatePolicy: 'OVERWRITE',
      },
    };
    const patch = provider.toTaskPatch(initial);
    const rehydrated = provider.hydrateDraft({ ...baseTask, configurationJson: patch.configurationJson as string });
    expect(rehydrated.transport).toBe('SFTP');
    expect(rehydrated.sftp).toEqual(initial.sftp);
  });

  it('normalizes an invalid remoteDuplicatePolicy to SKIP_IF_SAME_HASH', () => {
    const provider = new Mt101PayTaskProvider();
    const draft = provider.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({
        taskRef: 'p', executionMode: 'once', transport: 'SFTP',
        sftp: { sinkRef: 7, remoteDuplicatePolicy: 'NUKE' },
      }),
    });
    expect(draft.sftp.sinkRef).toBe('7');
    expect(draft.sftp.remoteDuplicatePolicy).toBe('SKIP_IF_SAME_HASH');
  });

  it('hydrateDraft accepts retryOn as array OR as string', () => {
    const provider = new Mt101PayTaskProvider();
    const fromArray = provider.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({
        taskRef: 'p', executionMode: 'once', transport: 'REST',
        retryPolicy: { retryOn: ['5xx', 'TIMEOUT'] },
      }),
    });
    expect(fromArray.retryPolicy.retryOnFamilies).toBe('5xx,TIMEOUT');

    const fromString = provider.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({
        taskRef: 'p', executionMode: 'once', transport: 'REST',
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
        taskRef: 'p', executionMode: 'once',
        transport: 'WHATEVER',
        confirmationMode: 'bogus',
        retryPolicy: { backoffStrategy: 'rocket' },
      }),
    });
    expect(draft.transport).toBe('REST');
    expect(draft.confirmationMode).toBe('sync');
    expect(draft.retryPolicy.backoffStrategy).toBe('exponential');
  });

  it('normalizes MQ to REST until backend transport exists', () => {
    const provider = new Mt101PayTaskProvider();
    const draft = provider.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({
        taskRef: 'p',
        executionMode: 'once',
        transport: 'MQ',
      }),
    });

    expect(draft.transport).toBe('REST');
  });

  it('un round-trip por la UI NO devuelve la sync de estado del pago a sus defaults', () => {
    // Mismo hallazgo que en MT101_STATUS (analisis v72): toTaskPatch reconstruia el payload desde cero, asi que
    // editar cualquier campo del form borraba las 6 claves que el backend SI lee y no estan en el draft. La mas
    // sensible: archiveStatusSync vuelve a su default true (reactiva una sync apagada a proposito) y
    // archiveStatusTable/ConnectionRef mandan el SENT/REJECTED a la tabla/conexion por DEFECTO.
    const p = new Mt101PayTaskProvider();
    const configurationJson = JSON.stringify({
      taskRef: 'pay', executionMode: 'once', transport: 'REST',
      rest: { url: 'https://gw/pay', method: 'POST' },
      archiveStatusSync: false,
      archiveStatusTable: 'mt101_archive_custom',
      archiveStatusConnectionRef: 'conn-archivo',
      connectionRef: 'conn-pay',
      pageSize: 250,
      maxRecordsInOutput: 50,
    });

    const draft = p.hydrateDraft({ ...baseTask, configurationJson });
    const saved = JSON.parse(p.toTaskPatch(draft).configurationJson as string);

    // archiveStatusSync=false es el caso limite: compactObject descarta '' y [], pero NO false.
    expect(saved['archiveStatusSync'], 'se perdio archiveStatusSync=false').toBe(false);
    expect(saved['archiveStatusTable']).toBe('mt101_archive_custom');
    expect(saved['archiveStatusConnectionRef']).toBe('conn-archivo');
    expect(saved['connectionRef']).toBe('conn-pay');
    expect(saved['pageSize']).toBe(250);
    expect(saved['maxRecordsInOutput']).toBe(50);
  });

  it('sin esas claves en la config, no se inventan al guardar', () => {
    const p = new Mt101PayTaskProvider();
    const saved = JSON.parse(p.toTaskPatch({ ...p.createDraft(), taskRef: 'pay' }).configurationJson as string);
    ['archiveStatusSync', 'archiveStatusTable', 'archiveStatusConnectionRef', 'pageSize', 'maxRecordsInOutput']
      .forEach((key) => expect(saved[key], `no deberia aparecer '${key}'`).toBeUndefined());
  });
});
