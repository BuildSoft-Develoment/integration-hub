import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  PROCESS_TASK_PROVIDERS,
  ProcessTaskFormModel,
  ProcessTaskProvider,
  ProcessTaskProviderDescriptor,
} from '@integration-hub/core/providers';
import { ProcessTaskManagerService } from './process-task-manager.service';

class LocalTaskProvider extends ProcessTaskProvider<Record<string, unknown>> {
  override readonly descriptor: ProcessTaskProviderDescriptor = {
    type: 'FILE_READ',
    labelKey: 'processTask.FILE_READ',
    descriptionKey: 'processTaskDescription.FILE_READ',
  };

  createDraft(): Record<string, unknown> {
    return { taskRef: '' };
  }

  hydrateDraft(): Record<string, unknown> {
    return { taskRef: 'hydrated', executionMode: 'once' };
  }

  toTaskPatch(): Partial<ProcessTaskFormModel> {
    return { configurationJson: '{"taskRef":""}' };
  }
}

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      ProcessTaskManagerService,
      LocalTaskProvider,
      {
        provide: PROCESS_TASK_PROVIDERS,
        useExisting: LocalTaskProvider,
        multi: true,
      },
    ],
  });
  return {
    manager: TestBed.inject(ProcessTaskManagerService),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('ProcessTaskManagerService remote task catalog', () => {
  it('adds backend remote task types without shadowing local providers', async () => {
    const { manager, http } = setup();
    const load = manager.loadRemoteTaskTypes();

    http.expectOne('/api/task-types').flush({
      taskTypes: [
        { type: 'FILE_READ', origin: 'REMOTE', status: 'AVAILABLE', pluginId: 'shadow' },
        { type: 'DEMO_TRANSFORM_NODE', origin: 'REMOTE', status: 'AVAILABLE', pluginId: 'demo-node', pluginVersion: '1.0.0', transport: 'GRPC' },
        { type: 'DEMO_TRANSFORM_PY', origin: 'REMOTE', status: 'UNTRUSTED', pluginId: 'demo-py', pluginVersion: '1.0.0', transport: 'GRPC' },
      ],
    });
    await load;

    const types = manager.availableProviders().map((item) => item.type);
    expect(types).toEqual(['FILE_READ', 'DEMO_TRANSFORM_NODE', 'DEMO_TRANSFORM_PY']);
    expect(manager.label('DEMO_TRANSFORM_NODE')).toBe('Demo Transform Node');
    expect(manager.isAvailable('DEMO_TRANSFORM_NODE')).toBe(true);
    expect(manager.isAvailable('DEMO_TRANSFORM_PY')).toBe(false);
    expect(manager.status('DEMO_TRANSFORM_PY')).toBe('UNTRUSTED');
    http.verify();
  });

  it('creates minimal schema-driven configuration for a remote task', async () => {
    const { manager, http } = setup();
    const load = manager.loadRemoteTaskTypes();
    http.expectOne('/api/task-types').flush({
      taskTypes: [
        { type: 'DEMO_TRANSFORM_JAVA', origin: 'REMOTE', status: 'AVAILABLE', pluginId: 'demo-java' },
      ],
    });
    await load;

    expect(JSON.parse(manager.defaultConfigurationJson('DEMO_TRANSFORM_JAVA', 'plugin-1'))).toEqual({
      taskRef: 'plugin-1',
      executionMode: 'once',
    });
    http.verify();
  });

  it('draftFor hydrates via the registered provider', () => {
    const { manager } = setup();
    const task: ProcessTaskFormModel = {
      clientId: 'c1', id: null, taskOrder: 1, taskType: 'FILE_READ',
      active: true, sourceDefinitionId: null, readerDefinitionId: null, configurationJson: '{}',
    };
    expect(manager.draftFor(task)).toEqual({ taskRef: 'hydrated', executionMode: 'once' });
  });

  it('draftFor throws (no-fallback) for a task type without a provider', () => {
    // Politica no-fallback: un form dedicado siempre corresponde a un type registrado; un provider ausente
    // es un bug de registro, no un estado a enmascarar con un draft por defecto.
    const { manager } = setup();
    const task: ProcessTaskFormModel = {
      clientId: 'c1', id: null, taskOrder: 1, taskType: 'MT101_BUILD',
      active: true, sourceDefinitionId: null, readerDefinitionId: null, configurationJson: '{}',
    };
    expect(() => manager.draftFor(task)).toThrow();
  });

  it('degrades gracefully for a task type without a provider (removed/unavailable)', () => {
    // Regresion: al remover MT101_BUILD, los procesos viejos que aun lo referencian
    // NO deben romper el render de la lista de tareas (antes label/summarize/modalLayout
    // lanzaban "No provider registered..."). label = tipo crudo, summarize = '',
    // modalLayout = undefined.
    const { manager } = setup();
    const task: ProcessTaskFormModel = {
      clientId: 'c1', id: null, taskOrder: 1, taskType: 'MT101_BUILD',
      active: true, sourceDefinitionId: null, readerDefinitionId: null, configurationJson: '{}',
    };
    const ctx = { sources: [], readers: [], connections: [] };

    expect(() => manager.label('MT101_BUILD')).not.toThrow();
    expect(manager.label('MT101_BUILD')).toBe('MT101_BUILD');
    expect(() => manager.summarize(task, ctx)).not.toThrow();
    expect(manager.summarize(task, ctx)).toBe('');
    expect(() => manager.modalLayout('MT101_BUILD')).not.toThrow();
    expect(manager.modalLayout('MT101_BUILD')).toBeUndefined();
    // La creacion sigue restringida a tipos registrados (esto SI debe lanzar).
    expect(() => manager.defaultConfigurationJson('MT101_BUILD', 'x')).toThrow();
  });
});
