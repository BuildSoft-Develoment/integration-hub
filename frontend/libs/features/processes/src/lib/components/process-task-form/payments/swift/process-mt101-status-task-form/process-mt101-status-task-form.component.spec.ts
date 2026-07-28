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
import { ProcessTaskFormModel } from '../../../../../models/process.models';

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
    resolveNormalPay: false, resolvesPayTaskRef: '', preserved: {},
    ...JSON.parse(t.configurationJson || '{}'),
  }),
  toTaskPatch: () => ({}),
};

function setup(config: Record<string, unknown>) {
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
  fixture.componentRef.setInput('tasks', []);
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
