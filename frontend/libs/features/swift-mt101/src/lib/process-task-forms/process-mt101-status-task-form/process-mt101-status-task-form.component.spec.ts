import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProcessTaskBindingContextService } from '@integration-hub/shared/process-form-kit';
import { ProcessSchemaFieldContextService } from '@integration-hub/shared/process-form-kit';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ProcessTaskFormBridgeService } from '@integration-hub/core/providers';
import { ProcessTaskManagerService } from '@integration-hub/core/services';
import { beforeAll, describe, expect, it } from 'vitest';

import { ProcessMt101StatusTaskFormComponent } from './process-mt101-status-task-form.component';
import { ProcessTaskFormModel } from '@integration-hub/core/providers';

/**
 * Restriccion de executionMode POR CAMINO. El motor descarta 'suspended' y la señal de conciliacion fuera de
 * 'once' (ver Mt101StatusTaskProvider.guardOnceExecutionMode), asi que el selector no debe ofrecer modos que
 * el backend va a rechazar RECIEN AL EJECUTAR, en pleno money-path.
 */
beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: () => undefined, removeListener: () => undefined,
      addEventListener: () => undefined, removeEventListener: () => undefined, dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
});

const managerStub = {
  // ADR-021: el binding resuelve descriptores por el manager. Sin este metodo el stub explota
  // ('resolve is not a function') apenas un test pase tareas origen; null = sin declaracion.
  resolve: () => null,
  draftFor: (t: ProcessTaskFormModel) => ({
    taskRef: 'st', executionMode: 'per-record', mode: 'query',
    queryUrl: '', queryMethod: 'GET', queryTimeoutSeconds: 30,
    statusField: '$.status', referenceField: '$.gatewayReference', errorMessageField: '$.error.message',
    connectionRef: '', confirmationTable: 'mt101_confirmation',
    // `preserved` quedo obsoleto (la clase base preserva por `ungoverned`); `routeQuery` es lo que el
    // formulario ahora gobierna, y sin el la pestaña de rutas revienta al renderizar.
    resolveNormalPay: false, resolvesPayTaskRef: '', routeQuery: [],
    ...JSON.parse(t.configurationJson || '{}'),
  }),
  // Guarda el ultimo draft serializado: es la unica forma de comprobar que un control emite lo que
  // dice emitir (p.ej. que activar la conciliacion fuerce executionMode en el MISMO patch).
  ultimoDraft: null as Record<string, unknown> | null,
  toTaskPatch: (_taskType: string, draft: Record<string, unknown>) => {
    managerStub.ultimoDraft = draft;
    return {};
  },
};

function setup(config: Record<string, unknown>, tasks: readonly unknown[] = []) {
  TestBed.configureTestingModule({
    imports: [ProcessMt101StatusTaskFormComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideNoopAnimations(),
      ProcessTaskFormBridgeService,
      { provide: ProcessTaskManagerService, useValue: managerStub },
      ProcessTaskBindingContextService,
      ProcessSchemaFieldContextService,
    ],
  });
  const fixture = TestBed.createComponent(ProcessMt101StatusTaskFormComponent);
  fixture.componentRef.setInput('task', {
    clientId: 'c1', taskType: 'MT101_STATUS', configurationJson: JSON.stringify(config),
  } as unknown as ProcessTaskFormModel);
  fixture.componentRef.setInput('tasks', tasks);
  fixture.componentRef.setInput('connections', []);
  fixture.detectChanges();
  return fixture;
}

describe('ProcessMt101StatusTaskFormComponent — executionMode por camino', () => {
  it('query simple ofrece los tres modos', () => {
    expect(setup({ mode: 'query' }).componentInstance.executionModes()).toEqual(['once', 'per-record', 'batch']);
  });

  it('poll solo ofrece once (suspende)', () => {
    expect(setup({ mode: 'poll' }).componentInstance.executionModes()).toEqual(['once']);
  });

  it('callback solo ofrece once (suspende)', () => {
    expect(setup({ mode: 'callback' }).componentInstance.executionModes()).toEqual(['once']);
  });

  it('query CON resolveNormalPay solo ofrece once (regresion del doble check)', () => {
    // Este camino emite la señal de conciliacion y el backend lo guarda igual. Antes el selector miraba solo
    // `mode`, asi que dejaba elegir per-record y la tarea reventaba recien al ejecutarse, en el money-path.
    expect(setup({ mode: 'query', resolveNormalPay: true }).componentInstance.executionModes()).toEqual(['once']);
  });
});

describe('ProcessMt101StatusTaskFormComponent — conciliacion del PAY normal', () => {
  const pay = (taskRef: string) => ({ taskType: 'MT101_PAY', configurationJson: JSON.stringify({ taskRef }) });

  it('ofrece los MT101_PAY del proceso para elegir cual concilia', () => {
    const fixture = setup({ mode: 'query' }, [pay('pay-a'), { taskType: 'MT101_ARCHIVE', configurationJson: '{}' }, pay('pay-b')]);
    expect(fixture.componentInstance.payTaskRefs()).toEqual(['pay-a', 'pay-b']);
  });

  it('ignora un PAY con JSON a medio escribir en vez de romper el formulario', () => {
    const fixture = setup({ mode: 'query' }, [pay('pay-a'), { taskType: 'MT101_PAY', configurationJson: '{roto' }]);
    expect(fixture.componentInstance.payTaskRefs()).toEqual(['pay-a']);
  });

  it('activar la conciliacion fuerza executionMode once EN EL MISMO patch', () => {
    // Sin esto se podia guardar resolveNormalPay + per-record, que el backend acepta y solo revienta
    // AL EJECUTARSE, en pleno money-path. El selector ya lo restringia, pero el valor guardado seguia
    // siendo el viejo hasta que el operador tocara el otro control.
    const fixture = setup({ mode: 'query', executionMode: 'per-record' });
    managerStub.ultimoDraft = null;
    fixture.componentInstance.updateResolveNormalPay(true);
    expect(managerStub.ultimoDraft).toMatchObject({ resolveNormalPay: true, executionMode: 'once' });
  });

  it('desactivarla limpia el PAY apuntado y NO pisa el executionMode elegido', () => {
    // `resolvesPayTaskRef` colgando se reemitiria sin conciliacion. Y devolver el modo a un default
    // seria pisarle al operador una decision suya.
    const fixture = setup({ mode: 'query', executionMode: 'once', resolveNormalPay: true, resolvesPayTaskRef: 'pay-a' });
    managerStub.ultimoDraft = null;
    fixture.componentInstance.updateResolveNormalPay(false);
    expect(managerStub.ultimoDraft).toMatchObject({ resolveNormalPay: false, resolvesPayTaskRef: '', executionMode: 'once' });
  });
});
