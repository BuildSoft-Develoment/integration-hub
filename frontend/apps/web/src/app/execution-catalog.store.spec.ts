import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ExecutionCatalogStore } from '../../../../libs/features/executions/src/lib/execution-catalog.store';
import { ExecutionApiService } from '../../../../libs/features/executions/src/lib/execution-api.service';

describe('ExecutionCatalogStore', () => {
  let store: ExecutionCatalogStore;
  let listCalls: Array<{ status?: string | null; page?: number; size?: number }> = [];

  beforeEach(() => {
    listCalls = [];

    TestBed.configureTestingModule({
      providers: [
        ExecutionCatalogStore,
        {
          provide: ExecutionApiService,
          useValue: {
            list: (params: { status?: string | null; page?: number; size?: number }) => {
              listCalls.push(params);
              return of([]);
            },
            get: () => of({}),
            listTasks: () => of([]),
          },
        },
      ],
    });

    store = TestBed.inject(ExecutionCatalogStore);
  });

  it('should load executions without status when filter is ALL', async () => {
    await store.load();

    expect(listCalls).toEqual([{ status: null, page: 0, size: 100 }]);
  });

  it('should reload executions from the api when the status filter changes', async () => {
    await store.load();
    listCalls = [];

    store.updateStatusFilter('FAILED');
    await Promise.resolve();

    expect(listCalls).toEqual([{ status: 'FAILED', page: 0, size: 100 }]);
  });
});
