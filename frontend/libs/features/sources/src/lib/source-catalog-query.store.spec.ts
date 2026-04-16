import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SourceApiService } from './source-api.service';
import { SourceCatalogQueryStore } from './source-catalog-query.store';

describe('SourceCatalogQueryStore', () => {
  let store: SourceCatalogQueryStore;
  let listCalls: Array<Record<string, unknown>>;

  beforeEach(() => {
    listCalls = [];

    TestBed.configureTestingModule({
      providers: [
        SourceCatalogQueryStore,
        {
          provide: SourceApiService,
          useValue: {
            list: (params: Record<string, unknown>) => {
              listCalls.push(params);
              return of({
                total: 1,
                items: [
                  {
                    id: 1,
                    name: 'source-a',
                    sourceType: 'FILESYSTEM',
                    active: true,
                    configurationJson: '{}',
                  },
                ],
              });
            },
          },
        },
      ],
    });

    store = TestBed.inject(SourceCatalogQueryStore);
  });

  it('should load sources with default filters', async () => {
    await store.load();

    expect(listCalls).toEqual([
      { search: '', type: 'ALL', status: 'ALL', page: 0, size: 8 },
    ]);
    expect(store.totalLength()).toBe(1);
  });

  it('should refresh filters and pagination through signals', async () => {
    store.updateTypeFilter('REST');
    await Promise.resolve();

    expect(store.typeFilter()).toBe('REST');
    expect(listCalls[listCalls.length - 1]).toEqual({
      search: '',
      type: 'REST',
      status: 'ALL',
      page: 0,
      size: 8,
    });
  });
});
