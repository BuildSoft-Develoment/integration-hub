import { TestBed } from '@angular/core/testing';

import { ExecutionEditorStore } from './execution-editor.store';

describe('ExecutionEditorStore', () => {
  let store: ExecutionEditorStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExecutionEditorStore],
    });

    store = TestBed.inject(ExecutionEditorStore);
  });

  it('should prefer the failed task when syncing a new execution context', () => {
    store.syncContext(
      {
        id: 5,
        processDefinitionId: 10,
        processName: 'Execution 5',
        status: 'FAILED',
        startedAt: null,
        finishedAt: null,
        sourceExecutionId: null,
        triggerSource: 'MANUAL',
        details: 'failed execution',
      },
      [
        createTask(100, 'COMPLETED'),
        createTask(200, 'FAILED', 'task failure'),
      ]
    );

    expect(store.selectedTaskId()).toBe(200);
    expect(store.failedTask()?.id).toBe(200);
    expect(store.selectedTaskSummary()).not.toBeNull();
    expect(store.failedExecutionSummary()).not.toBeNull();
  });

  it('should keep the selected task when the task is still present after refresh', () => {
    store.syncContext(null, [createTask(100, 'COMPLETED'), createTask(200, 'FAILED')]);
    store.selectTask(100);

    store.syncContext(null, [createTask(100, 'COMPLETED'), createTask(300, 'COMPLETED')]);

    expect(store.selectedTaskId()).toBe(100);
    expect(store.selectedTask()?.id).toBe(100);
  });

  it('should reset the selected task when the previous task disappears', () => {
    store.syncContext(null, [createTask(100, 'COMPLETED'), createTask(200, 'COMPLETED')]);
    store.selectTask(200);

    store.syncContext(null, [createTask(300, 'COMPLETED')]);

    expect(store.selectedTaskId()).toBe(300);
    expect(store.selectedTask()?.id).toBe(300);
  });
});

function createTask(
  id: number,
  status: string,
  details: string | null = null
) {
  return {
    id,
    processExecutionId: 1,
    taskDefinitionId: id,
    taskOrder: 1,
    taskType: 'FILE_READ',
    status,
    executedAt: null,
    startedAt: null,
    finishedAt: null,
    details,
    payloadJson: '{"recordsRead":10,"recordsSkipped":1}',
    processedFiles: [
      {
        id: id * 10,
        fileName: `file-${id}.csv`,
        filePath: `/tmp/file-${id}.csv`,
        mediaType: 'text/csv',
        fileSize: 100,
        lastModified: null,
        status,
        recordCount: 10,
        skippedCount: 1,
        writtenCount: 0,
        errorMessage: details,
      },
    ],
  };
}
