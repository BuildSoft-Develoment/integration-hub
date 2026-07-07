import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import {
  AppFeedbackService,
  ProcessExecutionApiService,
  UiMessageService,
} from '@integration-hub/core/services';

import { ExecutionCatalogCommandService } from './execution-catalog-command.service';
import { ExecutionCatalogQueryStore } from './execution-catalog-query.store';
import { ExecutionDetailStore } from '../details/execution-detail.store';
import { ExecutionFileActionService } from '../details/execution-file-action.service';

/**
 * Prueba de WIRING REAL (no mock): el consumidor resuelve el {@link ProcessExecutionApiService} REAL desde el barrel
 * de core (providedIn:'root') y dispara el HTTP real. Es el análogo frontend del E2E que en #4 atrapó el bean mal
 * inyectado — valida que la cadena consumidor → data-access de core → HttpClient funciona de verdad, no solo con mocks.
 */
describe('ExecutionCatalogCommandService (wiring real con ProcessExecutionApiService)', () => {
  let service: ExecutionCatalogCommandService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExecutionCatalogCommandService,
        ExecutionFileActionService,
        // NO se mockea ProcessExecutionApiService: se usa el real (providedIn:'root') + HttpClient de test.
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ExecutionCatalogQueryStore,
          useValue: { reload: vi.fn().mockResolvedValue(undefined) },
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
            reloadSelectedExecution: vi.fn().mockResolvedValue(undefined),
            actionRunning: signal(false),
          },
        },
        { provide: UiMessageService, useValue: { show: vi.fn() } },
        { provide: AppFeedbackService, useValue: { handleHttpError: vi.fn() } },
      ],
    });

    service = TestBed.inject(ExecutionCatalogCommandService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('dispara el POST real /api/process-executions/{id} vía el data-access de core', async () => {
    const action = service.runFileAction({
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

    // El consumidor resolvió el ProcessExecutionApiService REAL y emitió el POST con los parámetros del retry.
    const request = httpTesting.expectOne('/api/process-executions/7');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      selectedFiles: ['/tmp/failed.csv'],
      sourceExecutionId: 10,
    });
    request.flush({ id: 55, status: 'QUEUED' });

    await action;
  });
});
