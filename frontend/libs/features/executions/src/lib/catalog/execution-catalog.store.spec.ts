import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import {
  AppFeedbackService,
  ProcessExecutionApiService,
  UiMessageService,
} from '@integration-hub/core/services';

import { ExecutionApiService } from '../api/execution-api.service';
import { ExecutionCatalogCommandService } from './execution-catalog-command.service';
import { ExecutionCatalogQueryStore } from './execution-catalog-query.store';
import { ExecutionCatalogStore } from './execution-catalog.store';
import { ExecutionDetailLoaderService } from '../details/execution-detail-loader.service';
import { ExecutionDetailStore } from '../details/execution-detail.store';
import { ExecutionProgressPoller } from '../details/execution-progress-poller';
import { ExecutionFileActionService } from '../details/execution-file-action.service';
import { ExecutionNavigationService } from '../details/execution-navigation.service';

describe('ExecutionCatalogStore', () => {
  let store: ExecutionCatalogStore;
  let listCalls: Array<{
    search?: string;
    mode?: string | null;
    status?: string | null;
    page?: number;
    size?: number;
  }>;
  let execute: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    listCalls = [];
    execute = vi.fn().mockReturnValue(of({ id: 91 }));

    TestBed.configureTestingModule({
      providers: [
        ExecutionCatalogStore,
        ExecutionCatalogCommandService,
        ExecutionCatalogQueryStore,
        ExecutionDetailStore,
        ExecutionProgressPoller,
        ExecutionNavigationService,
        ExecutionDetailLoaderService,
        ExecutionFileActionService,
        {
          provide: ExecutionApiService,
          useValue: {
            list: (params: {
              search?: string;
              mode?: string | null;
              status?: string | null;
              page?: number;
              size?: number;
            }) => {
              listCalls.push(params);
              return of({
                items: [
                  {
                    id: 5,
                    processDefinitionId: 11,
                    processName: 'Execution 5',
                    status: 'FAILED',
                    startedAt: null,
                    finishedAt: null,
                    sourceExecutionId: null,
                    triggerSource: 'MANUAL',
                    details: null,
                  },
                ],
                total: 1,
              });
            },
          },
        },
        {
          provide: ProcessExecutionApiService,
          useValue: {
            execute,
          },
        },
        {
          provide: ExecutionDetailLoaderService,
          useValue: {
            load: (executionId: number) =>
              Promise.resolve({
                detail: {
                  id: executionId,
                  processDefinitionId: 11,
                  processName: `Execution ${executionId}`,
                  status: 'FAILED',
                  startedAt: null,
                  finishedAt: null,
                  sourceExecutionId: null,
                  triggerSource: 'MANUAL',
                  details: null,
                },
                tasks: [
                  {
                    id: 501,
                    processExecutionId: executionId,
                    taskDefinitionId: 1,
                    taskOrder: 1,
                    taskType: 'FILE_READ',
                    status: 'FAILED',
                    executedAt: null,
                    startedAt: null,
                    finishedAt: null,
                    details: null,
                    payloadJson: null,
                    processedFiles: [
                      {
                        id: 1,
                        fileName: 'failed.csv',
                        filePath: '/tmp/failed.csv',
                        mediaType: 'text/csv',
                        fileSize: 100,
                        lastModified: null,
                        status: 'FAILED',
                        recordCount: 1,
                        skippedCount: 0,
                        writtenCount: 0,
                        errorMessage: 'boom',
                      },
                    ],
                  },
                ],
                children: [],
              }),
          },
        },
        {
          provide: UiMessageService,
          useValue: {
            show: vi.fn(),
          },
        },
        {
          provide: AppFeedbackService,
          useValue: {
            handleHttpError: vi.fn(),
          },
        },
      ],
    });

    store = TestBed.inject(ExecutionCatalogStore);
  });

  it('should load executions through the query facade', async () => {
    await store.load();

    expect(store.executions()).toHaveLength(1);
    expect(listCalls).toEqual([
      { search: '', mode: 'ALL', status: null, page: 0, size: 8 },
    ]);
  });

  it('should select an execution and open the drawer', async () => {
    await store.selectExecution({
      id: 5,
      processDefinitionId: 11,
      processName: 'Execution 5',
      status: 'FAILED',
      startedAt: null,
      finishedAt: null,
      sourceExecutionId: null,
      triggerSource: 'MANUAL',
      details: null,
    });

    expect(store.drawerOpen()).toBeTruthy();
    expect(store.selectedExecution()?.id).toBe(5);
    expect(store.tasks()).toHaveLength(1);
  });

  it('should run file actions without losing the selected execution', async () => {
    await store.selectExecution({
      id: 5,
      processDefinitionId: 11,
      processName: 'Execution 5',
      status: 'FAILED',
      startedAt: null,
      finishedAt: null,
      sourceExecutionId: null,
      triggerSource: 'MANUAL',
      details: null,
    });

    await store.runFileAction({
      kind: 'retryFailed',
      files: store.tasks()[0]?.processedFiles ?? [],
    });

    expect(execute).toHaveBeenCalledWith(11, {
      selectedFiles: ['/tmp/failed.csv'],
      sourceExecutionId: 5,
    });
    expect(store.selectedExecutionId()).toBe(5);
    expect(store.drawerOpen()).toBeTruthy();
  });
});
