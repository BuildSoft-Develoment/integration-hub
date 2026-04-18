import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ReaderApiService } from '../api/reader-api.service';
import { ReaderCatalogQueryStore } from './reader-catalog-query.store';

describe('ReaderCatalogQueryStore', () => {
  let store: ReaderCatalogQueryStore;
  let listCalls: Array<Record<string, unknown>>;

  beforeEach(() => {
    listCalls = [];

    TestBed.configureTestingModule({
      providers: [
        ReaderCatalogQueryStore,
        {
          provide: ReaderApiService,
          useValue: {
            list: (params: Record<string, unknown>) => {
              listCalls.push(params);
              return of({
                total: 1,
                items: [
                  {
                    id: 1,
                    name: 'reader-a',
                    readerType: 'TXT',
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

    store = TestBed.inject(ReaderCatalogQueryStore);
  });

  it('should load readers with default filters', async () => {
    await store.load();

    expect(listCalls).toEqual([
      { search: '', type: 'ALL', page: 0, size: 8 },
    ]);
  });
});
