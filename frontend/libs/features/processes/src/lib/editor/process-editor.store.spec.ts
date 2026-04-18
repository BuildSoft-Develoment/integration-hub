import { TestBed } from '@angular/core/testing';

import { AuthAccessService } from '@integration-hub/core/services';

import { ProcessEditorStore } from './process-editor.store';
import { ProcessFlowApiService } from '../api/process-flow-api.service';
import {
  defaultTaskConfig,
  ProcessRecord,
} from '../models/process.models';

describe('ProcessEditorStore', () => {
  let store: ProcessEditorStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProcessEditorStore,
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

    expect(store.form().tasks[0]).toEqual(
      expect.objectContaining({
        clientId: task.clientId,
        taskType: 'DB_WRITE',
        sourceDefinitionId: null,
        readerDefinitionId: null,
        configurationJson: defaultTaskConfig('DB_WRITE'),
      })
    );
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
