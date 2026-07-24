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

  it('keeps the platform keys the plugin schema does not declare', () => {
    // Regresion (auditoria 2026-07-24): el schema-form emite group.getRawValue(), o sea SOLO los controles que
    // declara el config-schema del plugin. Ningun plugin declara las claves de plataforma, asi que reemplazar
    // el config las borraba: sin taskRef se rompe el cableado (las tareas aguas abajo lo referencian por
    // input.sourceTaskRef) y sin executionMode el motor rechaza la tarea.
    const seeded = JSON.stringify({
      taskRef: 'plugin-1',
      executionMode: 'batch',
      input: { source: 'task-output', sourceTaskRef: 'read', sourceOutput: 'records' },
      continueOnFailure: true,
      endpoint: 'https://viejo.example',
    });
    const { fixture, http } = createHost(task('ACME_DO', seeded));
    http.expectOne('/api/plugins/config-schema/ACME_DO').flush({ fields: [] });

    const patches: Partial<ProcessTaskFormModel>[] = [];
    fixture.componentInstance.patchTask.subscribe((p) => patches.push(p));
    fixture.componentInstance.onSchemaValue({ endpoint: 'https://nuevo.example' });

    const saved = JSON.parse(patches[0].configurationJson as string);
    expect(saved.taskRef, 'se perdio taskRef: rompe el cableado del pipeline').toBe('plugin-1');
    expect(saved.executionMode, 'se perdio executionMode: el motor rechaza la tarea').toBe('batch');
    expect(saved.input).toEqual({ source: 'task-output', sourceTaskRef: 'read', sourceOutput: 'records' });
    expect(saved.continueOnFailure).toBe(true);
    // Lo que el schema SI declara manda sobre lo anterior.
    expect(saved.endpoint).toBe('https://nuevo.example');
    http.verify();
  });
});
