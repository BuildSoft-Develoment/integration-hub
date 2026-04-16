import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  AppFeedbackService,
  UiMessageService,
} from '@integration-hub/core/services';
import { ExecutionCatalogStore } from '../../../../libs/features/executions/src/lib/execution-catalog.store';
import { ExecutionApiService } from '../../../../libs/features/executions/src/lib/execution-api.service';
import { ExecutionDetailLoaderService } from '../../../../libs/features/executions/src/lib/execution-detail-loader.service';
import { ExecutionFileActionService } from '../../../../libs/features/executions/src/lib/execution-file-action.service';
import { ExecutionNavigationService } from '../../../../libs/features/executions/src/lib/execution-navigation.service';

describe('ExecutionCatalogStore', () => {
  let store: ExecutionCatalogStore;
  let listCalls: Array<{
    search?: string;
    mode?: string | null;
    status?: string | null;
    page?: number;
    size?: number;
  }> = [];

  beforeEach(() => {
    listCalls = [];

    TestBed.configureTestingModule({
      providers: [
        ExecutionCatalogStore,
        {
          provide: ExecutionDetailLoaderService,
          useValue: {
            load: () =>
              Promise.resolve({
                detail: null,
                tasks: [],
                children: [],
              }),
          },
        },
        {
          provide: ExecutionFileActionService,
          useValue: {
            selectedFileReferences: () => [],
            successMessage: () => 'ok',
          },
        },
        {
          provide: ExecutionNavigationService,
          useValue: {
            navigationStack: () => [],
            reset: () => undefined,
            trimTo: () => false,
            pushCurrentExecution: () => undefined,
            popPrevious: () => null,
          },
        },
        {
          provide: AppFeedbackService,
          useValue: {
            handleHttpError: () => undefined,
          },
        },
        {
          provide: UiMessageService,
          useValue: {
            show: () => undefined,
          },
        },
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
              return of({ items: [], total: 0 });
            },
            get: () => of({}),
            listTasks: () => of([]),
            listChildren: () => of([]),
            execute: () => of({ id: 1 }),
          },
        },
      ],
    });

    store = TestBed.inject(ExecutionCatalogStore);
  });

  it('should load executions without status when filter is ALL', async () => {
    await store.load();

    expect(listCalls).toEqual([
      { search: '', mode: 'ALL', status: null, page: 0, size: 8 },
    ]);
  });

  it('should reload executions from the api when the status filter changes', async () => {
    await store.load();
    listCalls = [];

    store.updateStatusFilter('FAILED');
    await Promise.resolve();

    expect(listCalls).toEqual([
      { search: '', mode: 'ALL', status: 'FAILED', page: 0, size: 8 },
    ]);
  });
});
