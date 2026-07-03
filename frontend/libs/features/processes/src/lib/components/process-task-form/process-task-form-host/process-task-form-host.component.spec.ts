import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ProcessTaskFormHostComponent } from './process-task-form-host.component';
import { ProcessTaskFormModel } from '../../../models/process.models';

function task(taskType: string, configurationJson = '{}'): ProcessTaskFormModel {
  return { clientId: 'c1', taskType, configurationJson } as unknown as ProcessTaskFormModel;
}

function createHost(taskModel: ProcessTaskFormModel) {
  TestBed.configureTestingModule({
    imports: [ProcessTaskFormHostComponent],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  const fixture = TestBed.createComponent(ProcessTaskFormHostComponent);
  fixture.componentRef.setInput('task', taskModel);
  fixture.componentRef.setInput('tasks', []);
  fixture.componentRef.setInput('sources', []);
  fixture.componentRef.setInput('readers', []);
  fixture.componentRef.setInput('connections', []);
  fixture.detectChanges();
  const http = TestBed.inject(HttpTestingController);
  // El host consulta los transportes async al iniciar; se resuelve aqui para no ensuciar los verify().
  http.match('/api/messaging/transports').forEach((req) => req.flush(['KAFKA']));
  return { fixture, http };
}

describe('ProcessTaskFormHostComponent (schema-driven path)', () => {
  it('renders ih-schema-form for an unregistered type that has a backend config-schema', async () => {
    const { fixture, http } = createHost(task('ACME_DO'));

    http
      .expectOne('/api/plugins/config-schema/ACME_DO')
      .flush({ fields: [{ key: 'endpoint', type: 'text', label: 'Endpoint', required: true }] });
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('ih-schema-form')).toBeTruthy();
    expect(el.querySelector('.task-form-shell__missing')).toBeNull();
    http.verify();
  });

  it('shows the explicit not-registered message when the type declares no schema (no legacy fallback)', async () => {
    const { fixture, http } = createHost(task('MYSTERY'));

    http.expectOne('/api/plugins/config-schema/MYSTERY').flush({ fields: [] });
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('ih-schema-form')).toBeNull();
    expect(el.querySelector('.task-form-shell__missing')).toBeTruthy();
    http.verify();
  });

  it('persists the schema-form value as the task configurationJson', () => {
    const { fixture, http } = createHost(task('ACME_DO'));
    http.expectOne('/api/plugins/config-schema/ACME_DO').flush({ fields: [] });

    const patches: Partial<ProcessTaskFormModel>[] = [];
    fixture.componentInstance.patchTask.subscribe((p) => patches.push(p));
    fixture.componentInstance.onSchemaValue({ endpoint: 'https://acme.example', retries: 3 });

    expect(patches).toHaveLength(1);
    expect(JSON.parse(patches[0].configurationJson as string)).toEqual({
      endpoint: 'https://acme.example',
      retries: 3,
    });
    http.verify();
  });

  it('merges the common execution options (async / continueOnFailure) preserving the rest of the config', () => {
    const { fixture, http } = createHost(
      task('ACME_DO', '{"taskRef":"t1","executionMode":"batch","targetTable":"x"}'),
    );
    http.expectOne('/api/plugins/config-schema/ACME_DO').flush({ fields: [] });

    const patches: Partial<ProcessTaskFormModel>[] = [];
    fixture.componentInstance.patchTask.subscribe((p) => patches.push(p));
    const last = () => JSON.parse(patches[patches.length - 1].configurationJson as string);

    fixture.componentInstance.onAsyncChange(true);
    expect(last().async).toBe(true);
    expect(last().targetTable).toBe('x'); // preserva el resto de la config

    fixture.componentInstance.onContinueOnFailureChange(true);
    expect(last().continueOnFailure).toBe(true);
    expect(last().taskRef).toBe('t1');

    fixture.componentInstance.onTransportChange('RABBITMQ');
    expect(last().asyncTransport).toBe('RABBITMQ');

    fixture.componentInstance.onAsyncChange(false); // desactivar limpia async + asyncTransport
    expect(last().async).toBeUndefined();
    expect(last().asyncTransport).toBeUndefined();

    http.verify();
  });
});
