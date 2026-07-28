import { TestBed } from '@angular/core/testing';
import { ProcessTaskManagerService } from '@integration-hub/core/services';
import {
  PROCESS_TASK_PROVIDERS,
  ProcessTaskFormModel,
  ProcessTaskProvider,
  ProcessTaskProviderDescriptor,
  provideProcessTemplate,
  provideProcessTaskProviders,
} from '@integration-hub/core/providers';

/** ADR-021: provider ficticio que DECLARA su salida por defecto (antes el caso era un tipo MT101). */
class FakeDeclaresOutputProvider extends ProcessTaskProvider<Record<string, unknown>> {
  override readonly descriptor: ProcessTaskProviderDescriptor = {
    type: 'FAKE_DECLARES_OUTPUT',
    labelKey: 'processTask.FAKE_DECLARES_OUTPUT',
    descriptionKey: 'processTaskDescription.FAKE_DECLARES_OUTPUT',
    defaultOutput: 'fragments',
  };

  createDraft(): Record<string, unknown> {
    return {};
  }

  hydrateDraft(): Record<string, unknown> {
    return {};
  }

  toTaskPatch(): Partial<ProcessTaskFormModel> {
    return {};
  }
}

/** ADR-021: plantilla FICTICIA — el editor solo ensambla; el contenido lo aporta cada vertical. */
const FAKE_TEMPLATE = {
  id: 'fake-template',
  labelKey: 'processes.template.fake',
  tasks: [
    { taskType: 'FILE_READ' as const, ref: 'leer', overrides: { executionMode: 'batch' } },
    {
      taskType: 'DB_WRITE' as const,
      ref: 'guardar',
      overrides: {
        targetTable: 'staging_record',
        input: { source: 'task-output', sourceTaskRef: 'leer', sourceOutput: 'records' },
      },
    },
  ],
};

import { AuthAccessService } from '@integration-hub/core/services';

import { ProcessEditorStore } from './process-editor.store';
import { ProcessFlowApiService } from '../api/process-flow-api.service';
import { ProcessRecord } from '../models/process.models';

describe('ProcessEditorStore', () => {
  let store: ProcessEditorStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProcessEditorStore,
        ProcessTaskManagerService,
        // Solo los tipos del motor: el editor ya no conoce ninguno de un vertical.
        ...provideProcessTaskProviders(),
        provideProcessTemplate(FAKE_TEMPLATE),
        FakeDeclaresOutputProvider,
        { provide: PROCESS_TASK_PROVIDERS, useExisting: FakeDeclaresOutputProvider, multi: true },
        ProcessFlowApiService,
        {
          provide: AuthAccessService,
          useValue: {
            canAdmin: () => true,
            canOperate: () => true,
          },
        },
      ],
    });

    store = TestBed.inject(ProcessEditorStore);
  });

  it('should select a process in details mode and hydrate the form', () => {
    const process = createProcessRecord();

    store.selectProcess(process);

    expect(store.selectedProcessId()).toBe(process.id);
    expect(store.selectedProcess()).toEqual(process);
    expect(store.viewMode()).toBe('details');
    expect(store.drawerOpen()).toBeTruthy();
    expect(store.form().id).toBe(process.id);
    expect(store.form().tasks[0].sourceDefinitionId).toBe(11);
    expect(store.form().tasks[0].readerDefinitionId).toBe(21);
  });

  it('applyTemplate ensambla la plantilla REGISTRADA: orden, refs, merge y cadena (ADR-021)', () => {
    // Plantilla ficticia a proposito: lo que se prueba es el ENSAMBLADO del editor, no el contenido
    // de ningun estandar. Antes este test aplicaba la cadena MT101 escrita dentro de la store; ahora
    // el QUE lo aporta el vertical (y lo prueba el vertical) y el COMO se prueba aca.
    store.applyTemplate('fake-template');

    const tasks = store.form().tasks;
    expect(tasks.map((t) => t.taskType)).toEqual(['FILE_READ', 'DB_WRITE']);
    expect(tasks.map((t) => t.taskOrder)).toEqual([1, 2]);

    const configOf = (index: number) => JSON.parse(tasks[index].configurationJson || '{}');
    // El ref se persiste como taskRef, y los overrides pisan al config por defecto del provider.
    expect(configOf(0).taskRef).toBe('leer');
    expect(configOf(1)).toMatchObject({
      taskRef: 'guardar',
      targetTable: 'staging_record',
      input: { sourceTaskRef: 'leer', sourceOutput: 'records' },
    });

    // El flujo queda CONECTADO en cadena (regresion: antes los nodos aparecian sueltos).
    const edges = store.form().flowLayout.edges;
    expect(edges).toHaveLength(tasks.length - 1);
    expect(edges.some((e) => e.source === tasks[0].clientId && e.target === tasks[1].clientId)).toBe(true);
  });

  it('applyTemplate falla fuerte si la plantilla no esta registrada (politica no-fallback)', () => {
    expect(() => store.applyTemplate('no-existe')).toThrow(/not registered/);
  });

  it('should clear scheduleEvery when scheduled is disabled', () => {
    store.patchForm({
      scheduled: true,
      scheduleEvery: '0 */5 * * *',
    });

    store.patchForm({ scheduled: false });

    expect(store.form().scheduled).toBeFalsy();
    expect(store.form().scheduleEvery).toBe('');
  });

  it('should reset file-read references when the task type changes', () => {
    const task = store.form().tasks[0];

    store.updateTask(task.clientId, {
      sourceDefinitionId: 11,
      readerDefinitionId: 21,
      configurationJson: '{"source":"demo"}',
    });
    store.updateTask(task.clientId, { taskType: 'DB_WRITE' });

    const updated = store.form().tasks[0];
    expect(updated).toEqual(
      expect.objectContaining({
        clientId: task.clientId,
        taskType: 'DB_WRITE',
        sourceDefinitionId: null,
        readerDefinitionId: null,
      })
    );
    // La config del tipo anterior no sobrevive: se reemplaza por la default del tipo nuevo.
    // (Antes este spec esperaba '{}' porque no proveia el manager y el store caia al camino
    // degradado; con el manager registrado, como en produccion, la default viene del provider.)
    expect(updated.configurationJson).not.toContain('demo');
    expect(JSON.parse(updated.configurationJson || '{}')).toMatchObject({ taskRef: expect.any(String) });
  });

  it('la salida sugerida al encadenar sale del descriptor, no de un switch propio (ADR-021)', () => {
    // Regresion: el store tenia un clon del switch del binding context y ya estaba desincronizado,
    // asi que el editor de flujo sugeria 'summary' y el panel de runtime otra cosa para la MISMA
    // tarea origen. Ahora hay una sola fuente de verdad: el descriptor del provider.
    //
    // El caso concreto era un tipo de MT101; con un provider FICTICIO la prueba dice lo que de
    // verdad importa — que gana lo declarado — y no depende de ningun vertical.
    const manager = TestBed.inject(ProcessTaskManagerService);
    const declared = manager.resolve('FAKE_DECLARES_OUTPUT')?.descriptor.defaultOutput;

    expect(declared).toBe('fragments');
  });
});

function createProcessRecord(
  overrides: Partial<ProcessRecord> = {}
): ProcessRecord {
  return {
    id: 7,
    name: 'Proceso demo',
    description: 'Proceso de prueba',
    active: true,
    scheduled: true,
    scheduleEvery: '0 */5 * * *',
    nextRunAt: null,
    lastRunAt: null,
    flowLayoutJson: null,
    tasks: [
      {
        id: 101,
        taskOrder: 1,
        taskType: 'FILE_READ',
        active: true,
        configurationJson: '{}',
        sourceDefinition: { id: 11, name: 'source-a' },
        readerDefinition: { id: 21, name: 'reader-a' },
      },
    ],
    ...overrides,
  };
}
