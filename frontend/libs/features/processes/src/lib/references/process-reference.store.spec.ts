import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

import { ProcessApiService } from '../api/process-api.service';
import { ProcessReferenceStore } from './process-reference.store';

describe('ProcessReferenceStore', () => {
  let store: ProcessReferenceStore;

  const listSources = vi
    .fn()
    .mockReturnValue(of([{ id: 1, name: 'source-a' }]));
  const listReaders = vi
    .fn()
    .mockReturnValue(of([{ id: 2, name: 'reader-a' }]));
  const listConnections = vi
    .fn()
    .mockReturnValue(of([{ id: 3, name: 'connection-a', connectionType: 'POSTGRESQL' }]));

  beforeEach(() => {
    listSources.mockClear();
    listReaders.mockClear();
    listConnections.mockClear();

    TestBed.configureTestingModule({
      providers: [
        ProcessReferenceStore,
        {
          provide: ProcessApiService,
          useValue: {
            listSources,
            listReaders,
            listConnections,
          },
        },
      ],
    });

    store = TestBed.inject(ProcessReferenceStore);
  });

  it('should load and cache process references', async () => {
    await store.ensureLoaded();
    await store.ensureLoaded();

    expect(store.sources()).toEqual([{ id: 1, name: 'source-a' }]);
    expect(store.readers()).toEqual([{ id: 2, name: 'reader-a' }]);
    expect(store.connections()).toEqual([
      { id: 3, name: 'connection-a', connectionType: 'POSTGRESQL' },
    ]);
    expect(listSources).toHaveBeenCalledTimes(1);
    expect(listReaders).toHaveBeenCalledTimes(1);
    expect(listConnections).toHaveBeenCalledTimes(1);
  });

  it('should expose loading state while the first load is in progress', async () => {
    const sources$ = new Subject<Array<{ id: number; name: string }>>();

    listSources.mockImplementationOnce(
      () => sources$.asObservable()
    );

    const loadPromise = store.ensureLoaded();

    expect(store.loading()).toBeTruthy();

    sources$.next([{ id: 1, name: 'source-a' }]);
    sources$.complete();
    await loadPromise;

    expect(store.loading()).toBeFalsy();
  });
});
