import { TestBed } from '@angular/core/testing';

import { ExecutionDetailLoaderService } from './execution-detail-loader.service';
import { ExecutionDetailStore } from './execution-detail.store';
import { ExecutionNavigationService } from './execution-navigation.service';

describe('ExecutionDetailStore', () => {
  let store: ExecutionDetailStore;
  let load: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    load = vi.fn().mockImplementation((executionId: number) =>
      Promise.resolve({
        detail: {
          id: executionId,
          processDefinitionId: 10,
          processName: `Execution ${executionId}`,
          status: 'COMPLETED',
          startedAt: null,
          finishedAt: null,
          sourceExecutionId: executionId === 9 ? 3 : null,
          triggerSource: 'MANUAL',
          details: null,
        },
        tasks: [
          {
            id: executionId * 100,
            processExecutionId: executionId,
            taskDefinitionId: 1,
            taskOrder: 1,
            taskType: 'FILE_READ',
            status: 'COMPLETED',
            executedAt: null,
            startedAt: null,
            finishedAt: null,
            details: null,
            payloadJson: null,
            processedFiles: [],
          },
        ],
        children: [],
      })
    );

    TestBed.configureTestingModule({
      providers: [
        ExecutionDetailStore,
        ExecutionNavigationService,
        {
          provide: ExecutionDetailLoaderService,
          useValue: {
            load,
          },
        },
      ],
    });

    store = TestBed.inject(ExecutionDetailStore);
  });

  it('should load execution details and open the drawer', async () => {
    await store.selectExecution({
      id: 3,
      processDefinitionId: 10,
      processName: 'Execution 3',
      status: 'RUNNING',
      startedAt: null,
      finishedAt: null,
      sourceExecutionId: null,
      triggerSource: 'MANUAL',
      details: null,
    });

    expect(load).toHaveBeenCalledWith(3);
    expect(store.drawerOpen()).toBeTruthy();
    expect(store.selectedExecution()?.id).toBe(3);
    expect(store.tasks()).toHaveLength(1);
  });

  it('should keep lineage navigation when opening related executions', async () => {
    await store.selectExecution({
      id: 3,
      processDefinitionId: 10,
      processName: 'Execution 3',
      status: 'RUNNING',
      startedAt: null,
      finishedAt: null,
      sourceExecutionId: null,
      triggerSource: 'MANUAL',
      details: null,
    });

    await store.openRelatedExecution(9);

    expect(store.navigationStack()).toEqual([
      { executionId: 3, label: 'Ejecucion 3' },
    ]);
    expect(store.selectedExecution()?.id).toBe(9);
  });

  it('should refresh the selected execution only when ids match', () => {
    store.markSelectedExecution(8);
    store.refreshSelectedExecution({
      id: 8,
      processDefinitionId: 12,
      processName: 'Refreshed execution',
      status: 'FAILED',
      startedAt: null,
      finishedAt: null,
      sourceExecutionId: null,
      triggerSource: 'SCHEDULED',
      details: 'details',
    });

    expect(store.selectedExecution()).toEqual(
      expect.objectContaining({ id: 8, status: 'FAILED' })
    );

    store.refreshSelectedExecution({
      id: 99,
      processDefinitionId: 12,
      processName: 'Other execution',
      status: 'COMPLETED',
      startedAt: null,
      finishedAt: null,
      sourceExecutionId: null,
      triggerSource: 'SCHEDULED',
      details: null,
    });

    expect(store.selectedExecution()).toEqual(
      expect.objectContaining({ id: 8, status: 'FAILED' })
    );
  });
});
