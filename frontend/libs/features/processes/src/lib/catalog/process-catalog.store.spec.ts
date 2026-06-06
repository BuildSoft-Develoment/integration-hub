import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import {
  AppFeedbackService,
  AuthAccessService,
} from '@integration-hub/core/services';

import { ProcessApiService } from '../api/process-api.service';
import { ProcessCatalogCommandService } from './process-catalog-command.service';
import { ProcessCatalogQueryStore } from './process-catalog-query.store';
import { ProcessCatalogStore } from './process-catalog.store';
import { ProcessEditorStore } from '../editor/process-editor.store';
import { ProcessFlowApiService } from '../api/process-flow-api.service';
import { ProcessRecord } from '../models/process.models';
import { ProcessReferenceStore } from '../references/process-reference.store';

describe('ProcessCatalogStore', () => {
  let store: ProcessCatalogStore;
  let listResponse: { total: number; items: ProcessRecord[] };
  let feedbackCalls: string[];

  const savedProcess = createProcessRecord({
    id: 15,
    name: 'Proceso guardado',
    scheduled: false,
    scheduleEvery: '',
  });
  const activeProcess = createProcessRecord({
    id: 22,
    name: 'Proceso activo',
  });

  const list = vi.fn().mockImplementation(() => of(listResponse));
  const create = vi.fn().mockReturnValue(of(savedProcess));
  const execute = vi.fn().mockReturnValue(of({ ok: true }));
  const listSources = vi
    .fn()
    .mockReturnValue(of([{ id: 1, name: 'source-a' }]));
  const listReaders = vi
    .fn()
    .mockReturnValue(of([{ id: 2, name: 'reader-a' }]));
  const listConnections = vi
    .fn()
    .mockReturnValue(of([{ id: 3, name: 'connection-a', connectionType: 'POSTGRESQL' }]));

  beforeEach(() => {
    listResponse = { total: 1, items: [savedProcess] };
    feedbackCalls = [];
    list.mockClear();
    create.mockClear();
    execute.mockClear();
    listSources.mockClear();
    listReaders.mockClear();
    listConnections.mockClear();

    TestBed.configureTestingModule({
      providers: [
        ProcessCatalogStore,
        ProcessCatalogCommandService,
        ProcessCatalogQueryStore,
        ProcessEditorStore,
        ProcessReferenceStore,
        ProcessFlowApiService,
        {
          provide: ProcessApiService,
          useValue: {
            list,
            create,
            update: vi.fn(),
            setActive: vi.fn(),
            execute,
            listSources,
            listReaders,
            listConnections,
          },
        },
        {
          provide: AuthAccessService,
          useValue: {
            canAdmin: () => true,
            canOperate: () => true,
          },
        },
        {
          provide: AppFeedbackService,
          useValue: {
            created: (entityKey: string) =>
              feedbackCalls.push(`created:${entityKey}`),
            updated: (entityKey: string) =>
              feedbackCalls.push(`updated:${entityKey}`),
            activated: (entityKey: string) =>
              feedbackCalls.push(`activated:${entityKey}`),
            deactivated: (entityKey: string) =>
              feedbackCalls.push(`deactivated:${entityKey}`),
            info: (messageKey: string) =>
              feedbackCalls.push(`info:${messageKey}`),
          },
        },
      ],
    });

    store = TestBed.inject(ProcessCatalogStore);
  });

  it('should load process list without preloading editor references', async () => {
    listResponse = { total: 1, items: [activeProcess] };

    await store.load();

    expect(store.processes()).toEqual([activeProcess]);
    expect(store.totalLength()).toBe(1);
    expect(store.sources()).toEqual([]);
    expect(store.readers()).toEqual([]);
    expect(store.connections()).toEqual([]);
    expect(listSources).not.toHaveBeenCalled();
    expect(listReaders).not.toHaveBeenCalled();
    expect(listConnections).not.toHaveBeenCalled();
  });

  it('should load references when opening a process in the editor', async () => {
    await store.selectProcess(activeProcess);

    expect(store.sources()).toEqual([{ id: 1, name: 'source-a' }]);
    expect(store.readers()).toEqual([{ id: 2, name: 'reader-a' }]);
    expect(store.connections()).toEqual([
      { id: 3, name: 'connection-a', connectionType: 'POSTGRESQL' },
    ]);
    expect(store.selectedProcess()?.id).toBe(activeProcess.id);
  });

  it('should save a new process and keep the saved record selected', async () => {
    store.patchForm({
      name: 'Proceso guardado',
      description: 'Proceso de prueba',
      scheduled: false,
      scheduleEvery: 'ignored',
    });

    await store.save();

    expect(create).toHaveBeenCalled();
    expect(create.mock.calls[create.mock.calls.length - 1]?.[0]).toEqual(
      expect.objectContaining({
        name: 'Proceso guardado',
        description: 'Proceso de prueba',
        scheduled: false,
        scheduleEvery: '',
      })
    );
    expect(store.selectedProcess()?.id).toBe(savedProcess.id);
    expect(store.form().id).toBe(savedProcess.id);
    expect(store.viewMode()).toBe('details');
    expect(store.drawerOpen()).toBeTruthy();
    expect(feedbackCalls).toEqual(['created:entities.process']);
  });

  it('should execute a process and keep the drawer open', async () => {
    listResponse = { total: 1, items: [activeProcess] };
    await store.selectProcess(activeProcess);

    await store.execute(activeProcess);

    expect(execute).toHaveBeenCalledWith(activeProcess.id);
    expect(store.executing()).toBeFalsy();
    expect(store.selectedProcessId()).toBe(activeProcess.id);
    expect(store.drawerOpen()).toBeTruthy();
    expect(store.selectedProcess()?.id).toBe(activeProcess.id);
    // Ejecucion asincrona: el comando encola y notifica 'processes.queued' (no 'executed').
    expect(feedbackCalls).toEqual(['info:processes.queued']);
  });
});

function createProcessRecord(
  overrides: Partial<ProcessRecord> = {}
): ProcessRecord {
  return {
    id: 1,
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
