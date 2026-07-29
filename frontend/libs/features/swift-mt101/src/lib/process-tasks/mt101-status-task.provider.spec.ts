import { describe, expect, it } from 'vitest';
import { Mt101StatusTaskDraft, Mt101StatusTaskProvider } from './mt101-status-task.provider';
import { ProcessTaskFormModel } from '@integration-hub/core/providers';

const baseTask: ProcessTaskFormModel = {
  clientId: 'c', id: null, taskOrder: 1, taskType: 'MT101_STATUS', active: true,
  sourceDefinitionId: null, readerDefinitionId: null, configurationJson: '{}',
};

describe('Mt101StatusTaskProvider', () => {
  it('declares MT101_STATUS with workspace layout', () => {
    const p = new Mt101StatusTaskProvider();
    expect(p.descriptor.type).toBe('MT101_STATUS');
    expect(p.descriptor.modalLayout).toBe('workspace');
  });

  it('createDraft defaults to query mode + per-record', () => {
    const draft = new Mt101StatusTaskProvider().createDraft();
    expect(draft.mode).toBe('query');
    expect(draft.executionMode).toBe('per-record');
    expect(draft.queryMethod).toBe('GET');
    expect(draft.statusField).toBe('$.status');
  });

  it('serializes query + expectedGatewayResponse blocks', () => {
    const p = new Mt101StatusTaskProvider();
    const draft: Mt101StatusTaskDraft = {
      ...p.createDraft(),
      taskRef: 'st',
      queryUrl: 'https://x/status/${gatewayReference}',
      queryTimeoutSeconds: 45,
      connectionRef: '12',
    };
    const config = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    expect(config.mode).toBe('query');
    expect(config.query.url).toBe('https://x/status/${gatewayReference}');
    expect(config.query.timeoutSeconds).toBe(45);
    expect(config.expectedGatewayResponse.statusField).toBe('$.status');
    expect(config.connectionRef).toBe('12');
  });

  it('normalizes invalid mode to query', () => {
    const p = new Mt101StatusTaskProvider();
    const draft = p.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({
        taskRef: 'x', executionMode: 'per-record', mode: 'WHATEVER',
      }),
    });
    expect(draft.mode).toBe('query');
  });

  it('preserves poll/callback when explicit (UI puede ofrecerlos aunque backend rechace)', () => {
    const p = new Mt101StatusTaskProvider();
    const draftPoll = p.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({ taskRef: 'x', executionMode: 'per-record', mode: 'poll' }),
    });
    expect(draftPoll.mode).toBe('poll');

    const draftCb = p.hydrateDraft({
      ...baseTask,
      configurationJson: JSON.stringify({ taskRef: 'x', executionMode: 'per-record', mode: 'callback' }),
    });
    expect(draftCb.mode).toBe('callback');
  });

  it('un round-trip por la UI NO borra las claves de money-path ni las que el form no gobierna', () => {
    // Regresion (analisis v72): toTaskPatch reconstruia el payload desde cero con las 5 claves conocidas, asi
    // que editar cualquier campo del formulario borraba en silencio otras 16 que el backend SI lee — entre
    // ellas resolveNormalPay (conciliacion inline del PAY normal) y los bloques poll/callback de los dos modos
    // que la propia UI ofrece en su selector.
    const p = new Mt101StatusTaskProvider();
    const configurationJson = JSON.stringify({
      taskRef: 'st', executionMode: 'once', mode: 'query',
      query: { url: 'https://gw/st', method: 'GET', timeoutSeconds: 30 },
      expectedGatewayResponse: { statusField: '$.s', referenceField: '$.r', errorMessageField: '$.e' },
      connectionRef: '7', confirmationTable: 'mt101_confirmation',
      // money-path
      resolveNormalPay: true, resolvesPayTaskRef: 'pay-bank-a',
      // el resto que el form no gobierna todavia
      resolveCorrectivePay: true, fragmentSetId: 'SET-123', routeQuery: { bankA: { sftp: { host: 'h' } } },
      poll: { finalStatuses: ['ACCEPTED'], maxAttempts: 10 }, callback: { completeOnPartial: false },
      acceptedStatuses: ['ACCEPTED'], rejectedStatuses: ['REJECTED'], correctivePayStatuses: ['SENT'],
      archiveStatusSync: false, archiveStatusTable: 'mt101_archive',
      pageSize: 500, maxRecordsInOutput: 1000, executedBy: 'sys', reason: 'auto',
    });

    const draft = p.hydrateDraft({ ...baseTask, configurationJson });
    const saved = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    const original = JSON.parse(configurationJson);

    Object.keys(original).forEach((key) => {
      expect(saved[key], `se perdio la clave '${key}' al guardar desde la UI`).toEqual(original[key]);
    });
  });

  it('resolveNormalPay sembrado como STRING "true" no se pierde (espejo de Boolean.parseBoolean)', () => {
    // Doble check del propio fix: con `=== true` estricto, una config sembrada por API/seed con el string
    // "true" se leia como false y al guardar se OMITIA -> apagaba la conciliacion in-line en silencio. El
    // backend la lee con Boolean.parseBoolean(String.valueOf(raw)), que si acepta el string.
    const p = new Mt101StatusTaskProvider();
    ['true', 'TRUE', ' True '].forEach((raw) => {
      const draft = p.hydrateDraft({
        ...baseTask,
        configurationJson: JSON.stringify({ taskRef: 's', mode: 'query', resolveNormalPay: raw }),
      });
      expect(draft.resolveNormalPay, `no interpreto '${raw}' como true`).toBe(true);
      const saved = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
      expect(saved['resolveNormalPay'], `se perdio con '${raw}'`).toBe(true);
    });
  });

  it('un valor que NO es "true" queda en false (no se inventa activacion)', () => {
    const p = new Mt101StatusTaskProvider();
    ['false', '', 'si', '1'].forEach((raw) => {
      const draft = p.hydrateDraft({
        ...baseTask,
        configurationJson: JSON.stringify({ taskRef: 's', mode: 'query', resolveNormalPay: raw }),
      });
      expect(draft.resolveNormalPay, `'${raw}' no deberia activar la conciliacion`).toBe(false);
    });
  });

  it('resolveNormalPay solo se emite cuando esta activo (ausente == false en el backend)', () => {
    const p = new Mt101StatusTaskProvider();
    const saved = JSON.parse(p.toTaskPatch({ ...p.createDraft(), taskRef: 's' }).configurationJson as string);
    expect(saved['resolveNormalPay']).toBeUndefined();
    expect(saved['resolvesPayTaskRef']).toBeUndefined();
  });

  it('roundtrip preserves the draft fields', () => {
    const p = new Mt101StatusTaskProvider();
    const initial: Mt101StatusTaskDraft = {
      ...p.createDraft(),
      taskRef: 's1',
      mode: 'query',
      queryUrl: 'https://gw.bank/v1/status/${gatewayReference}',
      queryMethod: 'GET',
      queryTimeoutSeconds: 20,
      statusField: '$.data.state',
      referenceField: '$.data.id',
      errorMessageField: '$.error.detail',
      connectionRef: '7',
      confirmationTable: 'custom_conf',
    };
    const patch = p.toTaskPatch(initial);
    const rehydrated = p.hydrateDraft({ ...baseTask, configurationJson: patch.configurationJson as string });
    // `ungoverned` lo agrega la clase base al hidratar: es la bolsa de claves que este formulario no
    // gobierna. Acá va vacía porque la config del caso solo trae claves gobernadas.
    expect(rehydrated).toEqual({ ...initial, ungoverned: {} });
  });

  it('gobierna routeQuery sin perder las claves por ruta que el form no expone', () => {
    // routeQuery paso de bolsa preservada a campo TIPADO: el formulario expone ruta, transporte,
    // endpoint/sinkRef y tokens, pero el backend lee mas por ruta (method, timeoutSeconds,
    // statusField...). Esas viajan en la bolsa por ruta; sin ella, gobernar seria retroceder.
    const p = new Mt101StatusTaskProvider();
    const config = {
      mode: 'query',
      routeQuery: {
        BANCO_A: {
          transport: 'SFTP',
          responseFileTemplate: '/ack/x.ack',
          acceptedTokens: ['ACCP'],
          sftp: { sinkRef: 11 },
          statusField: '$.custom',
          timeoutSeconds: 45,
        },
      },
    };
    const task = { ...baseTask, configurationJson: JSON.stringify(config) };

    const draft = p.hydrateDraft(task);
    expect(draft.routeQuery).toHaveLength(1);
    expect(draft.routeQuery[0].route).toBe('BANCO_A');
    expect(draft.routeQuery[0].sinkRef, 'el picker lee el sinkRef').toBe('11');
    expect(draft.routeQuery[0].acceptedTokens).toBe('ACCP');

    const out = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    const ruta = out.routeQuery.BANCO_A;
    expect(ruta.statusField, 'clave no expuesta por el form: sobrevive').toBe('$.custom');
    expect(ruta.timeoutSeconds, 'clave no expuesta por el form: sobrevive').toBe(45);
    expect(ruta.sftp, 'la conexion sigue saliendo de la fuente').toEqual({ sinkRef: 11 });
  });

  it('emite la forma EXACTA que parsea el backend (contrato front <-> Mt101StatusQueryExecutor)', () => {
    // Este es el hueco que ni los tests del front ni los del backend cubren solos: cada lado prueba su
    // mitad y la forma del JSON queda sin duenno. La misma estructura que se afirma aca es la que usa el
    // E2E contra SFTP real (Mt101StatusTaskProviderTest#correctivePathResolvesTheBankAck...): si alguien
    // renombra una clave en la serializacion, esto rompe antes de que el banco no responda en produccion.
    const p = new Mt101StatusTaskProvider();
    const draft = {
      ...p.createDraft(),
      taskRef: 'st',
      routeQuery: [{
        route: 'SFTP_BANK',
        transport: 'SFTP' as const,
        url: '',
        sinkRef: '11',
        responseFileTemplate: '/upload/x.ack',
        acceptedTokens: 'ACCP, ACK',
        rejectedTokens: 'RJCT',
        rest: { statusField: '$.s', timeoutSeconds: 30 },
      }],
    };

    const out = JSON.parse(p.toTaskPatch(draft).configurationJson as string);

    expect(out.routeQuery.SFTP_BANK).toEqual({
      transport: 'SFTP',
      responseFileTemplate: '/upload/x.ack',
      acceptedTokens: ['ACCP', 'ACK'],
      rejectedTokens: ['RJCT'],
      sftp: { sinkRef: 11 },
      statusField: '$.s',
      timeoutSeconds: 30,
    });
  });

  it('una ruta sin nombre no se emite: routeQuery ausente != vacio', () => {
    //  NO es lo mismo que no tenerlo: un objeto vacio deja el modo route-aware apagado
    // pero deja la clave escrita, y una fila a medio llenar en la UI no debe cambiar el modo de consulta.
    const p = new Mt101StatusTaskProvider();
    const draft = {
      ...p.createDraft(),
      taskRef: 'st',
      routeQuery: [{ route: '  ', transport: 'REST' as const, url: 'https://x',
        sinkRef: '', responseFileTemplate: '', acceptedTokens: '', rejectedTokens: '', rest: {} }],
    };

    const out = JSON.parse(p.toTaskPatch(draft).configurationJson as string);
    expect(out.routeQuery).toBeUndefined();
  });
});