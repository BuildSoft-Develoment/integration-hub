import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { ProcessApiService } from './process-api.service';
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
    let resolveSources: ((value: [{ id: number; name: string }]) => void) | null =
      null;

    listSources.mockImplementationOnce(
      () =>
        new Observable((subscriber) => {
          resolveSources = (value) => {
            subscriber.next(value);
            subscriber.complete();
          };
        })
    );

    const loadPromise = store.ensureLoaded();

    expect(store.loading()).toBeTruthy();

    resolveSources?.([{ id: 1, name: 'source-a' }]);
    await loadPromise;

    expect(store.loading()).toBeFalsy();
  });
});
