import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ExecutionApiService } from './execution-api.service';
import { ExecutionCatalogQueryStore } from './execution-catalog-query.store';
import { ExecutionDetailStore } from './execution-detail.store';

describe('ExecutionCatalogQueryStore', () => {
  let store: ExecutionCatalogQueryStore;
  let listCalls: Array<{
    search?: string;
    mode?: string | null;
    status?: string | null;
    page?: number;
    size?: number;
  }>;
  let refreshSelectedExecution: ReturnType<typeof vi.fn>;
  let selectedExecutionId: number | null;

  beforeEach(() => {
    listCalls = [];
    selectedExecutionId = null;
    refreshSelectedExecution = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        ExecutionCatalogQueryStore,
        {
          provide: ExecutionDetailStore,
          useValue: {
            selectedExecutionId: () => selectedExecutionId,
            refreshSelectedExecution,
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
              return of({
                items: [
                  {
                    id: 7,
                    processDefinitionId: 11,
                    processName: 'Sync files',
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
      ],
    });

    store = TestBed.inject(ExecutionCatalogQueryStore);
  });

  it('should load executions without status when filter is ALL', async () => {
    await store.load();

    expect(listCalls).toEqual([
      { search: '', mode: 'ALL', status: null, page: 0, size: 8 },
    ]);
    expect(store.totalLength()).toBe(1);
  });

  it('should refresh the selected execution when it is present in the new page', async () => {
    selectedExecutionId = 7;

    await store.load();

    expect(refreshSelectedExecution).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, status: 'FAILED' })
    );
  });

  it('should reload executions when the status filter changes', async () => {
    await store.load();
    listCalls = [];

    store.updateStatusFilter('FAILED');
    await Promise.resolve();

    expect(listCalls).toEqual([
      { search: '', mode: 'ALL', status: 'FAILED', page: 0, size: 8 },
    ]);
  });
});
