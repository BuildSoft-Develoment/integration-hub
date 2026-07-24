import { describe, expect, it } from 'vitest';
import { Mt101ReconcileTaskProvider } from './mt101-reconcile-task.provider';
import { Mt101ParseFromTableTaskProvider } from './mt101-parse-from-table-task.provider';
import { Mt101InboundDeliverTaskProvider } from './mt101-inbound-deliver-task.provider';
import { Mt101BuildFromTableTaskProvider } from './mt101-build-from-table-task.provider';
import { ProcessTaskFormModel } from '../../../../tasks/process-task.models';

/**
 * Auditoria 2026-07-24: `toTaskPatch` reconstruye el configurationJson desde cero, asi que toda clave que el
 * backend lee y el draft no carga se BORRA al editar cualquier campo del formulario y guardar.
 * Cada caso de aca reproduce el round-trip real (hydrate -> toTaskPatch) sobre una config sembrada.
 */
function task(taskType: string, config: Record<string, unknown>): ProcessTaskFormModel {
  return {
    clientId: 'c', id: null, taskOrder: 2, taskType, active: true,
    sourceDefinitionId: null, readerDefinitionId: null, configurationJson: JSON.stringify(config),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function roundTrip(p: any, taskType: string, config: Record<string, unknown>): any {
  return JSON.parse(p.toTaskPatch(p.hydrateDraft(task(taskType, config))).configurationJson as string);
}

describe('MT101_RECONCILE', () => {
  it('conserva archiveStatusSync=false (ausente == true en el backend)', () => {
    // Mt101ReconcileTaskProvider:143 usa boolValue(x, TRUE): perderlo REACTIVA la escritura de vuelta a la
    // tabla de archivo que el operador apago. Misma clave y mismo fallo ya corregidos en MT101_PAY.
    const saved = roundTrip(new Mt101ReconcileTaskProvider(), 'MT101_RECONCILE', {
      taskRef: 'rec', executionMode: 'once', sentTable: 'mt101_archive',
      confirmationTable: 'mt101_confirmation', matchKeys: ['senders_reference'],
      asOfDate: '${today}', lookbackDays: 5,
      archiveStatusSync: false,
    });
    expect(saved.archiveStatusSync, 'se perdio archiveStatusSync=false').toBe(false);
  });
});

describe('MT101_PARSE_FROM_TABLE', () => {
  it('conserva el pin del lote historico y el scope por tarea', () => {
    // source.processExecutionId es el PIN para re-parsear un lote HISTORICO: al perderlo la lectura vuelve a
    // la corrida actual -> 0 filas -> la tarea devuelve "skipped" como EXITO. source.taskDefinitionId ausente
    // ELIMINA el predicado y amplia la lectura a las filas de todas las tareas.
    const saved = roundTrip(new Mt101ParseFromTableTaskProvider(), 'MT101_PARSE_FROM_TABLE', {
      taskRef: 'pft', executionMode: 'once', pageSize: 500, connectionRef: 'conn-staging',
      source: {
        table: 'staging_record', payloadColumn: 'payload_json', idColumn: 'id',
        processExecutionId: 4242, taskDefinitionId: 77,
      },
    });
    expect(saved.connectionRef, 'se perdio connectionRef: la lectura cae al datasource por defecto')
      .toBe('conn-staging');
    expect(saved.source.processExecutionId, 'se perdio el pin del lote historico').toBe(4242);
    expect(saved.source.taskDefinitionId, 'se perdio el scope por tarea').toBe(77);
  });
});

describe('MT101_INBOUND_DELIVER', () => {
  it('cambiar el transporte a DB no destruye el endpoint ni las credenciales', () => {
    // applyHttpRequestToPayload solo corre en REST. Sin preservar, guardar en DB borraba el slice HTTP y NO
    // era recuperable: al volver a REST se guardaba url:'' y el backend lanza "requires url".
    const p = new Mt101InboundDeliverTaskProvider();
    const restConfig = {
      taskRef: 'ind', executionMode: 'once', transport: 'REST', pageSize: 500,
      url: 'https://gw.banco/inbound', method: 'POST',
      authType: 'bearer', token: '${secret:inbound/gw/token}',
    };
    const draft = p.hydrateDraft(task('MT101_INBOUND_DELIVER', restConfig));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const saved: any = JSON.parse(p.toTaskPatch({ ...draft, transport: 'DB' }).configurationJson as string);

    expect(saved.transport).toBe('DB');
    expect(saved.url, 'se perdio el endpoint al pasar a DB').toBe(restConfig.url);
    expect(saved.token, 'se perdieron las credenciales al pasar a DB').toBe(restConfig.token);
  });

  it('en REST SI se puede borrar el token (el form gobierna el HTTP)', () => {
    // Doble check del propio fix: applyHttpRequestToPayload escribe el token CONDICIONALMENTE, asi que
    // preservar tambien en REST haria que borrarlo no surtiera efecto — cambiar "la UI pierde credenciales"
    // por "la UI no puede quitarlas".
    const p = new Mt101InboundDeliverTaskProvider();
    const draft = p.hydrateDraft(task('MT101_INBOUND_DELIVER', {
      taskRef: 'ind', transport: 'REST', pageSize: 500,
      url: 'https://gw.banco/inbound', authType: 'bearer', token: 'viejo',
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const saved: any = JSON.parse(p.toTaskPatch({ ...draft, token: '', authType: '' }).configurationJson as string);

    expect(saved.token, 'el token borrado revivio').toBeUndefined();
    expect(saved.authType, 'authType apagado revivio').toBeUndefined();
  });
});

describe('MT101_BUILD_FROM_TABLE', () => {
  it('conserva source, connectionRef y fragmentSetIdTemplate', () => {
    // `source` define DE QUE tabla/columna/conexion se construyen los pagos; recordIndexIn acota un rebuild
    // selectivo (al perderlo se reconstruye TODO en vez de solo las filas corregidas).
    const saved = roundTrip(new Mt101BuildFromTableTaskProvider(), 'MT101_BUILD_FROM_TABLE', {
      taskRef: 'bft', executionMode: 'once', format: 'FIN',
      connectionRef: 'conn-origen',
      fragmentSetIdTemplate: 'SET-${_processExecutionId}-corregido',
      source: {
        table: 'staging_corregido', payloadColumn: 'payload_json', idColumn: 'id',
        recordIndexIn: [3, 7, 11], rebuildRunId: 'RUN-9',
      },
    });
    expect(saved.connectionRef, 'se perdio connectionRef del origen').toBe('conn-origen');
    expect(saved.fragmentSetIdTemplate, 'se perdio la identidad del fragment set')
      .toBe('SET-${_processExecutionId}-corregido');
    expect(saved.source?.table, 'se perdio la tabla de origen').toBe('staging_corregido');
    expect(saved.source?.recordIndexIn, 'se des-acoto el rebuild selectivo').toEqual([3, 7, 11]);
  });
});
