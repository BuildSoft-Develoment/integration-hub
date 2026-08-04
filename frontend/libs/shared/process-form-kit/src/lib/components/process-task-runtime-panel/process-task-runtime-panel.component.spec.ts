import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskBindingContextService } from '../../services/process-task-binding-context.service';
import { ProcessSchemaFieldContextService } from '../../services/process-schema-field-context.service';

import { AsyncState } from '../../services/messaging-transports.service';
import { ProcessTaskRuntimePanelComponent } from './process-task-runtime-panel.component';

function setup(
  draft: Record<string, unknown>,
  asyncState: AsyncState = 'READY',
  options: {
    taskType?: string;
    capabilities?: Array<{ type: string; asyncOffload: string }>;
    tasks?: readonly unknown[];
  } = {}
) {
  TestBed.configureTestingModule({
    imports: [ProcessTaskRuntimePanelComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      // ADR-021: bajaron a scope de componente; el TestBed hace de ancestro que los provee.
      ProcessTaskManagerService,
      ProcessTaskBindingContextService,
      ProcessSchemaFieldContextService,
    ],
  });
  const fixture = TestBed.createComponent(ProcessTaskRuntimePanelComponent);
  fixture.componentRef.setInput('task', {
    clientId: 'c1',
    taskType: options.taskType ?? 'DB_WRITE',
    taskOrder: 2,
    configurationJson: '{}',
  });
  fixture.componentRef.setInput('tasks', options.tasks ?? []);
  fixture.componentRef.setInput('draft', draft);
  const http = TestBed.inject(HttpTestingController);
  // El panel consulta al iniciar los transportes, el estado del feature async y las capacidades por tipo.
  http.match('/api/messaging/transports').forEach((req) => req.flush(['KAFKA', 'RABBITMQ']));
  http
    .match('/api/messaging/async-status')
    .forEach((req) => req.flush({ state: asyncState, executionEnabled: asyncState !== 'DISABLED' }));
  http
    .match('/api/task-types')
    .forEach((req) => req.flush({ taskTypes: options.capabilities ?? [] }));
  return { fixture, http };
}

describe('ProcessTaskRuntimePanelComponent (async dispatch)', () => {
  it('enabling async emits { async: true } as a runtime patch', () => {
    const { fixture, http } = setup({ taskRef: 't', executionMode: 'batch' });
    let emitted: unknown;
    fixture.componentInstance.runtimeChange.subscribe((e) => (emitted = e));

    fixture.componentInstance.updateAsync(true);

    expect(emitted).toEqual({ async: true });
    http.verify();
  });

  it('disabling async also clears the transport', () => {
    const { fixture, http } = setup({ taskRef: 't', executionMode: 'batch', async: true, asyncTransport: 'KAFKA' });
    let emitted: Record<string, unknown> = {};
    fixture.componentInstance.runtimeChange.subscribe((e) => (emitted = e as Record<string, unknown>));

    fixture.componentInstance.updateAsync(false);

    expect(emitted['async']).toBe(false);
    expect(emitted['asyncTransport']).toBeUndefined();
    http.verify();
  });

  it('exposes the transports fetched from the broker endpoint', () => {
    const { fixture, http } = setup({ taskRef: 't', executionMode: 'once' });
    expect(fixture.componentInstance.transports()).toEqual(['KAFKA', 'RABBITMQ']);
    http.verify();
  });

  it('reflects the READY async state (no warning)', () => {
    const { fixture, http } = setup({ taskRef: 't', executionMode: 'once' }, 'READY');
    expect(fixture.componentInstance.asyncState()).toBe('READY');
    http.verify();
  });

  it('reflects the DISABLED async state', () => {
    const { fixture, http } = setup({ taskRef: 't', executionMode: 'once' }, 'DISABLED');
    expect(fixture.componentInstance.asyncState()).toBe('DISABLED');
    http.verify();
  });

  it('reflects the DEGRADED async state (enabled but not operational)', () => {
    const { fixture, http } = setup({ taskRef: 't', executionMode: 'once' }, 'DEGRADED');
    expect(fixture.componentInstance.asyncState()).toBe('DEGRADED');
    http.verify();
  });

  // e2e de cadena completa: respuesta HTTP {state} -> signal del panel -> binding [asyncState] -> sección hija ->
  // aviso renderizado en el DOM. Ningún otro test cubre HTTP->DOM (los del panel miran el signal; los de la sección,
  // el input directo). El aviso vive dentro de @if(async()), por eso el draft trae async:true.
  it('renders the DEGRADED warning end-to-end (HTTP state -> child section DOM)', () => {
    const { fixture, http } = setup({ taskRef: 't', executionMode: 'once', async: true }, 'DEGRADED');
    fixture.detectChanges();
    const warning = (fixture.nativeElement as HTMLElement).querySelector('.async-dispatch__warning');
    expect(warning).toBeTruthy();
    // El chip muestra el texto corto; la explicacion completa va en el tooltip (matTooltip).
    expect(warning?.textContent?.trim()).toBe(
      fixture.componentInstance.i18n.t('ui.asyncFeatureDegradedShort')
    );
    http.verify();
  });

  it('renders no async warning end-to-end when the state is READY', () => {
    const { fixture, http } = setup({ taskRef: 't', executionMode: 'once', async: true }, 'READY');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.async-dispatch__warning')).toBeNull();
    http.verify();
  });

  it('exposes the async capability for the current task type from the catalog', () => {
    const { fixture, http } = setup({ taskRef: 't', executionMode: 'batch' }, 'READY', {
      taskType: 'REST_CALL',
      capabilities: [{ type: 'REST_CALL', asyncOffload: 'SLICE_ONLY' }],
    });
    expect(fixture.componentInstance.asyncOffloadSupport()).toBe('SLICE_ONLY');
    http.verify();
  });

  it('defaults capability to SUPPORTED when the type is absent from the catalog', () => {
    const { fixture, http } = setup({ taskRef: 't', executionMode: 'once' }, 'READY', {
      taskType: 'FAKE_PARSE',
      capabilities: [{ type: 'REST_CALL', asyncOffload: 'SLICE_ONLY' }],
    });
    expect(fixture.componentInstance.asyncOffloadSupport()).toBe('SUPPORTED');
    http.verify();
  });
});

describe('ProcessTaskRuntimePanelComponent (tarea origen)', () => {
  const previousTask = {
    clientId: 'c0',
    taskType: 'FAKE_BUILD_FROM_TABLE',
    taskOrder: 1,
    configurationJson: '{"taskRef":"task-10"}',
  };

  it('expone la etiqueta completa de la tarea origen para el tooltip', () => {
    // El trigger del select recorta con elipsis cuando el taskRef + tipo no entra en el ancho del campo
    // (paso con "task-10 - UN_TIPO_DE_TAREA_LARGO"): sin title el valor completo era ilegible sin desplegar.
    const { fixture, http } = setup(
      { taskRef: 't', executionMode: 'once', input: { source: 'task-output', sourceTaskRef: 'task-10', sourceOutput: 'records' } },
      'READY',
      { tasks: [previousTask] },
    );

    // El tipo de la fixture es inventado y por tanto NO tiene clave de diccionario, asi que la
    // etiqueta sale marcada. Antes salia como `task-10 - FAKE_BUILD_FROM_TABLE`, o sea el enum
    // crudo colado como si fuera un nombre: ese disimulo es justo lo que se elimino, y esta
    // expectativa lo certificaba. Lo que este caso comprueba es la COMPOSICION taskRef + tipo.
    expect(fixture.componentInstance.selectedTaskLabel()).toBe('task-10 - ⚠ FAKE_BUILD_FROM_TABLE');
    http.verify();
  });

  it('sin tarea origen elegida la etiqueta queda vacia (no rompe el title)', () => {
    const { fixture, http } = setup({ taskRef: 't', executionMode: 'once' }, 'READY', { tasks: [] });
    expect(fixture.componentInstance.selectedTaskLabel()).toBe('');
    http.verify();
  });
});
