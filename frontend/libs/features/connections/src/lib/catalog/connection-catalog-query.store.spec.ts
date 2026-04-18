import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ConnectionApiService } from '../api/connection-api.service';
import { ConnectionCatalogQueryStore } from './connection-catalog-query.store';

describe('ConnectionCatalogQueryStore', () => {
  let store: ConnectionCatalogQueryStore;
  let listCalls: Array<Record<string, unknown>>;

  beforeEach(() => {
    listCalls = [];

    TestBed.configureTestingModule({
      providers: [
        ConnectionCatalogQueryStore,
        {
          provide: ConnectionApiService,
          useValue: {
            list: (params: Record<string, unknown>) => {
              listCalls.push(params);
              return of({
                total: 1,
                items: [
                  {
                    id: 1,
                    name: 'connection-a',
                    connectionType: 'POSTGRESQL',
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

    store = TestBed.inject(ConnectionCatalogQueryStore);
  });

  it('should load connections with default filters', async () => {
    await store.load();

    expect(listCalls).toEqual([
      { search: '', type: 'ALL', status: 'ALL', page: 0, size: 8 },
    ]);
  });
});
