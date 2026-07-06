import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import {
  AppFeedbackService,
  ProcessExecutionApiService,
  UiMessageService,
} from '@integration-hub/core/services';

import { ExecutionCatalogCommandService } from './execution-catalog-command.service';
import { ExecutionCatalogQueryStore } from './execution-catalog-query.store';
import { ExecutionDetailStore } from '../details/execution-detail.store';
import { ExecutionFileActionService } from '../details/execution-file-action.service';

describe('ExecutionCatalogCommandService', () => {
  let service: ExecutionCatalogCommandService;
  let execute: ReturnType<typeof vi.fn>;
  let reload: ReturnType<typeof vi.fn>;
  let reloadSelectedExecution: ReturnType<typeof vi.fn>;
  let show: ReturnType<typeof vi.fn>;
  let handleHttpError: ReturnType<typeof vi.fn>;
  let actionRunning: ReturnType<typeof signal<boolean>>;

  beforeEach(() => {
    execute = vi.fn().mockReturnValue(of({ id: 44 }));
    reload = vi.fn().mockResolvedValue(undefined);
    reloadSelectedExecution = vi.fn().mockResolvedValue(undefined);
    show = vi.fn();
    handleHttpError = vi.fn();
    actionRunning = signal(false);

    TestBed.configureTestingModule({
      providers: [
        ExecutionCatalogCommandService,
        ExecutionFileActionService,
        {
          provide: ProcessExecutionApiService,
          useValue: {
            execute,
          },
        },
        {
          provide: ExecutionCatalogQueryStore,
          useValue: {
            reload,
          },
        },
        {
          provide: ExecutionDetailStore,
          useValue: {
            selectedExecution: () => ({
              id: 10,
              processDefinitionId: 7,
              processName: 'Execution 10',
              status: 'FAILED',
              startedAt: null,
              finishedAt: null,
              sourceExecutionId: null,
              triggerSource: 'MANUAL',
              details: null,
            }),
            reloadSelectedExecution,
            actionRunning,
          },
        },
        {
          provide: UiMessageService,
          useValue: {
            show,
          },
        },
        {
          provide: AppFeedbackService,
          useValue: {
            handleHttpError,
          },
        },
      ],
    });

    service = TestBed.inject(ExecutionCatalogCommandService);
  });

  it('should execute a file action and refresh query and details', async () => {
    await service.runFileAction({
      kind: 'retryFailed',
      files: [
        {
          id: 1,
          fileName: 'failed.csv',
          filePath: '/tmp/failed.csv',
          mediaType: 'text/csv',
          fileSize: 100,
          lastModified: null,
          status: 'FAILED',
          recordCount: 2,
          skippedCount: 0,
          writtenCount: 0,
          errorMessage: 'boom',
        },
      ],
    });

    expect(execute).toHaveBeenCalledWith(7, {
      selectedFiles: ['/tmp/failed.csv'],
      sourceExecutionId: 10,
    });
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'success' })
    );
    expect(reload).toHaveBeenCalled();
    expect(reloadSelectedExecution).toHaveBeenCalled();
    expect(actionRunning()).toBeFalsy();
  });

  it('should route errors through app feedback', async () => {
    execute.mockReturnValueOnce(throwError(() => new Error('network')));

    await service.runFileAction({
      kind: 'reprocessSelected',
      files: [
        {
          id: 2,
          fileName: 'retry.csv',
          filePath: '/tmp/retry.csv',
          mediaType: 'text/csv',
          fileSize: 100,
          lastModified: null,
          status: 'FAILED',
          recordCount: 1,
          skippedCount: 0,
          writtenCount: 0,
          errorMessage: null,
        },
      ],
    });

    expect(handleHttpError).toHaveBeenCalled();
    expect(actionRunning()).toBeFalsy();
  });
});
