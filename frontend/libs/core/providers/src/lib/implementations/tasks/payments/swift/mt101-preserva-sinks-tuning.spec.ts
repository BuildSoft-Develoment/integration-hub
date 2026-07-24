import { describe, expect, it } from 'vitest';
import { Mt101ValidateTaskProvider } from './mt101-validate-task.provider';
import { Mt101ReconcileTaskProvider } from './mt101-reconcile-task.provider';
import { Mt101ArchiveTaskProvider } from './mt101-archive-task.provider';
import { Mt101RouteTaskProvider } from './mt101-route-task.provider';
import { RestCallTaskProvider } from '../../rest/rest-call-task.provider';
import { ProcessTaskFormModel } from '../../../../tasks/process-task.models';

/**
 * Auditoria 2026-07-24, puntos 5 y 6.
 *
 * <p>(5) Hidrataciones que NO saben parsear todas las formas que el backend acepta: el form lee solo
 * {@code "table:conn:tabla"}, y al guardar reconstruia el configurationJson sin la clave — borrando en silencio
 * un sink que el backend si entendia.</p>
 *
 * <p>(6) Tuning que el backend lee y el form no expone: se perdia en CADA guardado.</p>
 */
function task(taskType: string, config: Record<string, unknown>): ProcessTaskFormModel {
  return {
    clientId: 'c', id: null, taskOrder: 1, taskType, active: true,
    sourceDefinitionId: null, readerDefinitionId: null, configurationJson: JSON.stringify(config),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function roundTrip(p: any, taskType: string, config: Record<string, unknown>): any {
  return JSON.parse(p.toTaskPatch(p.hydrateDraft(task(taskType, config))).configurationJson as string);
}

describe('MT101_VALIDATE — sink de incidencias', () => {
  it('conserva la forma "table:tabla" (sin conexion), que el form no sabe parsear', () => {
    // Es la forma que usan los propios ITs (Mt101AllTasksProcessE2EIT:166). Al perderla,
    // IssueSink.from(null) devuelve disabled(): las incidencias dejan de persistirse EN SILENCIO y se pierde
    // el rastro de por que se rechazo un pago.
    const saved = roundTrip(new Mt101ValidateTaskProvider(), 'MT101_VALIDATE', {
      taskRef: 'val', executionMode: 'once', ruleSet: 'structural-mvp',
      publishIssuesTo: 'table:mt101_validation_issue',
    });
    expect(saved.publishIssuesTo, 'se apago el sink de incidencias').toBe('table:mt101_validation_issue');
  });

  it('conserva la forma mapa VERBATIM (stringificarla escribiria "[object Object]")', () => {
    // IssueSink.from acepta un Map {table, connectionRef}. Guardarlo como String daria "[object Object]", que
    // IssueSink.enabled rechaza con IllegalArgumentException en ejecucion: corromper la config es peor que
    // perderla.
    const saved = roundTrip(new Mt101ValidateTaskProvider(), 'MT101_VALIDATE', {
      taskRef: 'val', publishIssuesTo: { table: 'mt101_validation_issue', connectionRef: 'conn-audit' },
    });
    expect(saved.publishIssuesTo).toEqual({ table: 'mt101_validation_issue', connectionRef: 'conn-audit' });
  });

  it('conserva el apagado explicito ("none")', () => {
    const saved = roundTrip(new Mt101ValidateTaskProvider(), 'MT101_VALIDATE', {
      taskRef: 'val', publishIssuesTo: 'none',
    });
    expect(saved.publishIssuesTo).toBe('none');
  });

  it('cuando el form SI parseo, manda el form y vaciar la tabla apaga el sink', () => {
    // Doble check del propio fix: preservar el crudo no debe impedir apagar el sink desde la UI.
    const p = new Mt101ValidateTaskProvider();
    const draft = p.hydrateDraft(task('MT101_VALIDATE', {
      taskRef: 'val', publishIssuesTo: 'table:conn-audit:mt101_validation_issue',
    }));
    expect(draft.publishIssuesConnectionRef).toBe('conn-audit');

    const saved = JSON.parse(p.toTaskPatch({ ...draft, publishIssuesTable: '' }).configurationJson as string);

    expect(saved.publishIssuesTo, 'el sink borrado revivio').toBeUndefined();
  });

  it('conserva maxIssuesInOutput y pageSize', () => {
    const saved = roundTrip(new Mt101ValidateTaskProvider(), 'MT101_VALIDATE', {
      taskRef: 'val', maxIssuesInOutput: 25, pageSize: 2000,
    });
    expect(saved.maxIssuesInOutput).toBe(25);
    expect(saved.pageSize).toBe(2000);
  });
});

describe('MT101_RECONCILE — sink de excepciones', () => {
  it('conserva la forma "table:tabla" (sin conexion)', () => {
    // parseExceptionTable cae a mt101_reconciliation_exception cuando la clave falta: las excepciones de
    // conciliacion se escribirian en una tabla DISTINTA de la configurada, sin aviso.
    const saved = roundTrip(new Mt101ReconcileTaskProvider(), 'MT101_RECONCILE', {
      taskRef: 'rec', sentTable: 'mt101_archive', confirmationTable: 'mt101_confirmation',
      publishExceptionsTo: 'table:excepciones_tesoreria',
    });
    expect(saved.publishExceptionsTo).toBe('table:excepciones_tesoreria');
  });

  it('conserva el nombre suelto', () => {
    const saved = roundTrip(new Mt101ReconcileTaskProvider(), 'MT101_RECONCILE', {
      taskRef: 'rec', publishExceptionsTo: 'excepciones_tesoreria',
    });
    expect(saved.publishExceptionsTo).toBe('excepciones_tesoreria');
  });

  it('cuando el form SI parseo, manda el form', () => {
    const p = new Mt101ReconcileTaskProvider();
    const draft = p.hydrateDraft(task('MT101_RECONCILE', {
      taskRef: 'rec', publishExceptionsTo: 'table:conn-1:excepciones_viejas',
    }));

    const saved = JSON.parse(
      p.toTaskPatch({ ...draft, exceptionTable: 'excepciones_nuevas' }).configurationJson as string);

    expect(saved.publishExceptionsTo).toBe('table:conn-1:excepciones_nuevas');
  });
});

describe('MT101_ARCHIVE', () => {
  it('conserva el par de cifrado a medio configurar', () => {
    // encryptionEnabled deriva del par COMPLETO (igual que resolveEncryptor del backend). Con el par a medias
    // el round-trip borraba las dos claves: el backend no cifra en ninguno de los dos casos, pero el operador
    // perdia su configuracion a medio hacer sin aviso.
    const saved = roundTrip(new Mt101ArchiveTaskProvider(), 'MT101_ARCHIVE', {
      taskRef: 'arc', table: 'mt101_archive', encryptColumn: 'raw_payload',
    });
    expect(saved.encryptColumn).toBe('raw_payload');
  });

  it('desmarcar el cifrado con el par COMPLETO si lo apaga', () => {
    // Doble check del propio fix: preservar el par completo haria que la casilla no pudiera apagar el cifrado.
    const p = new Mt101ArchiveTaskProvider();
    const draft = p.hydrateDraft(task('MT101_ARCHIVE', {
      taskRef: 'arc', encryptColumn: 'raw_payload', encryptionSecretRef: '${secret:archive/key}',
    }));
    expect(draft.encryptionEnabled).toBe(true);

    const saved = JSON.parse(
      p.toTaskPatch({ ...draft, encryptionEnabled: false }).configurationJson as string);

    expect(saved.encryptColumn, 'el cifrado apagado revivio').toBeUndefined();
    expect(saved.encryptionSecretRef).toBeUndefined();
  });

  it('conserva maxRecordsInOutput y pageSize', () => {
    const saved = roundTrip(new Mt101ArchiveTaskProvider(), 'MT101_ARCHIVE', {
      taskRef: 'arc', maxRecordsInOutput: 50, pageSize: 1500,
    });
    expect(saved.maxRecordsInOutput).toBe(50);
    expect(saved.pageSize).toBe(1500);
  });
});

describe('MT101_ROUTE', () => {
  it('conserva pageSize', () => {
    const saved = roundTrip(new Mt101RouteTaskProvider(), 'MT101_ROUTE', {
      taskRef: 'rou', rules: [], defaultRoute: 'UNROUTED', pageSize: 1200,
    });
    expect(saved.pageSize).toBe(1200);
  });
});

describe('REST_CALL', () => {
  it('conserva loginTimeoutSeconds y tokenTtlSeconds', () => {
    // HttpRequestSupport las lee pero no existen en HttpRequestDraft: se perdian en cada guardado.
    const saved = roundTrip(new RestCallTaskProvider(), 'REST_CALL', {
      taskRef: 'rc', mode: 'per-record', url: 'https://gw.banco/api',
      authType: 'login', loginUrl: 'https://gw.banco/login',
      loginTimeoutSeconds: 45, tokenTtlSeconds: 900,
    });
    expect(saved.loginTimeoutSeconds).toBe(45);
    expect(saved.tokenTtlSeconds).toBe(900);
  });

  it('sigue pudiendo borrar el token (preserved no toca el slice HTTP)', () => {
    const p = new RestCallTaskProvider();
    const draft = p.hydrateDraft(task('REST_CALL', {
      taskRef: 'rc', url: 'https://gw.banco/api', authType: 'bearer', token: 'viejo', tokenTtlSeconds: 900,
    }));

    const saved = JSON.parse(p.toTaskPatch({ ...draft, token: '', authType: '' }).configurationJson as string);

    expect(saved.token, 'el token borrado revivio').toBeUndefined();
    expect(saved.tokenTtlSeconds, 'el tuning si debe sobrevivir').toBe(900);
  });
});
