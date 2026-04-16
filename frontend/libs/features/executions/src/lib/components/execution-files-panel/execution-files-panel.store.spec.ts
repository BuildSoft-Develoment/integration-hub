import { TestBed } from '@angular/core/testing';

import { ExecutionFilesPanelStore } from './execution-files-panel.store';

describe('ExecutionFilesPanelStore', () => {
  let store: ExecutionFilesPanelStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExecutionFilesPanelStore],
    });

    store = TestBed.inject(ExecutionFilesPanelStore);
  });

  it('should reset filters and selection when the task changes', () => {
    store.syncTask(createTask(1));
    store.updateFilters({ status: 'FAILED', name: 'error' });
    store.toggleRow(store.allFiles()[0]!, true);

    store.syncTask(createTask(2));

    expect(store.filters()).toEqual({
      name: '',
      path: '',
      status: '',
      modifiedFrom: '',
      modifiedTo: '',
      minSize: '',
      maxSize: '',
    });
    expect(store.selectedKeys()).toEqual([]);
  });

  it('should keep only visible rows when toggling all visible off', () => {
    store.syncTask(createTask(1));

    store.toggleAllVisible(true);
    expect(store.selectedKeys()).toHaveLength(3);

    store.updateFilters({ status: 'FAILED' });
    store.toggleAllVisible(false);

    expect(store.selectedRows()).toEqual([]);
    expect(store.selectedKeys()).toEqual([
      '/tmp/completed.csv',
      '/tmp/pending.csv',
    ]);
  });

  it('should expose filtered groups for actions', () => {
    store.syncTask(createTask(1));
    store.updateFilters({ status: 'FAILED' });

    expect(store.filteredFiles()).toHaveLength(1);
    expect(store.failedFiles()).toHaveLength(1);
    expect(store.completedFiles()).toHaveLength(0);
    expect(store.pendingFiles()).toHaveLength(0);
  });
});

function createTask(id: number) {
  return {
    id,
    processExecutionId: 99,
    taskDefinitionId: id,
    taskOrder: 1,
    taskType: 'FILE_READ',
    status: 'FAILED',
    executedAt: null,
    startedAt: null,
    finishedAt: null,
    details: null,
    payloadJson: null,
    processedFiles: [
      createFile(1, 'completed.csv', 'COMPLETED'),
      createFile(2, 'failed.csv', 'FAILED'),
      createFile(3, 'pending.csv', 'PENDING'),
    ],
  };
}

function createFile(id: number, fileName: string, status: 'COMPLETED' | 'FAILED' | 'PENDING') {
  return {
    id,
    fileName,
    filePath: `/tmp/${fileName}`,
    mediaType: 'text/csv',
    fileSize: 10,
    lastModified: null,
    status,
    recordCount: 1,
    skippedCount: 0,
    writtenCount: 0,
    errorMessage: status === 'FAILED' ? 'boom' : null,
  };
}
