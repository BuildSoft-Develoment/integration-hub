import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ProcessTaskRuntimePanelComponent } from './process-task-runtime-panel.component';

function setup(
  draft: Record<string, unknown>,
  asyncEnabled = true,
  options: { taskType?: string; capabilities?: Array<{ type: string; asyncOffload: string }> } = {}
) {
  TestBed.configureTestingModule({
    imports: [ProcessTaskRuntimePanelComponent],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  const fixture = TestBed.createComponent(ProcessTaskRuntimePanelComponent);
  fixture.componentRef.setInput('task', {
    clientId: 'c1',
    taskType: options.taskType ?? 'DB_WRITE',
    configurationJson: '{}',
  });
  fixture.componentRef.setInput('tasks', []);
  fixture.componentRef.setInput('draft', draft);
  const http = TestBed.inject(HttpTestingController);
  // El panel consulta al iniciar los transportes, el estado del feature async y las capacidades por tipo.
  http.match('/api/messaging/transports').forEach((req) => req.flush(['KAFKA', 'RABBITMQ']));
  http.match('/api/messaging/async-status').forEach((req) => req.flush({ executionEnabled: asyncEnabled }));
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

  it('reflects the async feature enabled', () => {
    const { fixture, http } = setup({ taskRef: 't', executionMode: 'once' }, true);
    expect(fixture.componentInstance.asyncFeatureEnabled()).toBe(true);
    http.verify();
  });

  it('reflects the async feature disabled', () => {
    const { fixture, http } = setup({ taskRef: 't', executionMode: 'once' }, false);
    expect(fixture.componentInstance.asyncFeatureEnabled()).toBe(false);
    http.verify();
  });

  it('exposes the async capability for the current task type from the catalog', () => {
    const { fixture, http } = setup({ taskRef: 't', executionMode: 'batch' }, true, {
      taskType: 'REST_CALL',
      capabilities: [{ type: 'REST_CALL', asyncOffload: 'SLICE_ONLY' }],
    });
    expect(fixture.componentInstance.asyncOffloadSupport()).toBe('SLICE_ONLY');
    http.verify();
  });

  it('defaults capability to SUPPORTED when the type is absent from the catalog', () => {
    const { fixture, http } = setup({ taskRef: 't', executionMode: 'once' }, true, {
      taskType: 'MT101_PARSE',
      capabilities: [{ type: 'REST_CALL', asyncOffload: 'SLICE_ONLY' }],
    });
    expect(fixture.componentInstance.asyncOffloadSupport()).toBe('SUPPORTED');
    http.verify();
  });
});
