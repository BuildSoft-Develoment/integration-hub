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

  it('applyMassiveMt101Template scaffolds the full chain with fragments bindings', () => {
    store.applyMassiveMt101Template();

    const tasks = store.form().tasks;
    expect(tasks.map((t) => t.taskType)).toEqual([
      'FILE_READ', 'DB_WRITE', 'MT101_BUILD_FROM_TABLE',
      'MT101_VALIDATE', 'MT101_ARCHIVE', 'MT101_PAY',
    ]);

    const configOf = (index: number) => JSON.parse(tasks[index].configurationJson || '{}');
    // DB_WRITE consume los records del FILE_READ hacia staging_record.
    expect(configOf(1).input).toMatchObject({ sourceTaskRef: 'leer-archivo', sourceOutput: 'records' });
    expect(configOf(1).targetTable).toBe('staging_record');
    expect(configOf(1).jdbcBatchSize).toBe(5000);
    // BUILD_FROM_TABLE lee la tabla staging.
    expect(configOf(2).input).toMatchObject({ sourceTaskRef: 'staging', sourceOutput: 'table' });
    expect(configOf(2)).toMatchObject({
      fragmentSetIdTemplate: 'MT101-${_processExecutionId}',
      replaceExisting: true,
      maxTransactionsPerMessage: 100,
      maxBytesPerMessage: 10000,
      maxRecordsInOutput: 1000,
    });
    expect(configOf(3)).toMatchObject({
      pageSize: 200,
      publishIssuesTo: 'table:mt101_validation_issue',
      maxIssuesInOutput: 1000,
    });
    expect(configOf(4)).toMatchObject({ pageSize: 200, maxRecordsInOutput: 1000 });
    expect(configOf(5)).toMatchObject({ pageSize: 200, maxRecordsInOutput: 1000 });
    // VALIDATE / ARCHIVE / PAY encadenan fragments del build (no records/summary).
    for (const i of [3, 4, 5]) {
      expect(configOf(i).input).toMatchObject({
        sourceTaskRef: 'build-mt101-masivo',
        sourceOutput: 'fragments',
      });
      expect(configOf(i).executionMode).toBe('once');
    }
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
        configurationJson: defaultTaskConfig('DB_WRITE', task.clientId),
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
