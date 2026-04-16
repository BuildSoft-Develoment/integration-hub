import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import {
  AppFeedbackService,
  AuthAccessService,
  AuthService,
  SourceManagerService,
} from '@integration-hub/core/services';
import { SourceDraft } from '@integration-hub/core/providers';
import { SourceCatalogStore } from '../../../../libs/features/sources/src/lib/source-catalog.store';
import { SourceApiService } from '../../../../libs/features/sources/src/lib/source-api.service';
import { SourceEditorStateService } from '../../../../libs/features/sources/src/lib/source-editor-state.service';

describe('SourceCatalogStore', () => {
  let store: SourceCatalogStore;
  let testImpl: () => any;
  let feedbackCalls: string[] = [];

  const filesystemDraft: SourceDraft = {
    type: 'FILESYSTEM',
    connectionKind: 'filesystem',
    pollingMode: 'manual',
    includePatterns: ['*.*'],
    path: '/dropzone/clientes',
    fileNameTemplate: '',
    templateVariablesText: '',
    selectionMode: 'latestModified',
    fileErrorPolicy: 'failFast',
    mediaType: '',
  };

  beforeEach(() => {
    testImpl = () => of({ success: true, message: 'Fuente OK' });
    feedbackCalls = [];

    TestBed.configureTestingModule({
      providers: [
        SourceCatalogStore,
        SourceEditorStateService,
        {
          provide: SourceApiService,
          useValue: {
            list: () => of([]),
            create: () =>
              of({
                id: 1,
                name: 'demo',
                sourceType: 'FILESYSTEM',
                active: true,
                configurationJson: '{}',
              }),
            update: () =>
              of({
                id: 1,
                name: 'demo',
                sourceType: 'FILESYSTEM',
                active: true,
                configurationJson: '{}',
              }),
            setActive: () =>
              of({
                id: 1,
                name: 'demo',
                sourceType: 'FILESYSTEM',
                active: true,
                configurationJson: '{}',
              }),
            test: () => testImpl(),
          },
        },
        {
          provide: SourceManagerService,
          useValue: {
            createDraftFor: () => ({ ...filesystemDraft }),
            hydrateDraft: () => ({ ...filesystemDraft }),
            serializeDraft: () => JSON.stringify({ path: filesystemDraft.path }),
            availableProviders: () => [],
          },
        },
        {
          provide: AuthService,
          useValue: {},
        },
        {
          provide: AuthAccessService,
          useValue: {
            canAdmin: () => true,
          },
        },
        {
          provide: AppFeedbackService,
          useValue: {
            created: () => feedbackCalls.push('created'),
            updated: () => feedbackCalls.push('updated'),
            activated: () => feedbackCalls.push('activated'),
            deactivated: () => feedbackCalls.push('deactivated'),
            testSuccess: (entityKey: string) => feedbackCalls.push(`tested:${entityKey}`),
          },
        },
      ],
    });

    store = TestBed.inject(SourceCatalogStore);
  });

  it('should keep local source test errors inside the panel state', async () => {
    testImpl = () =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { details: 'No se pudo validar la ruta remota' },
          })
      );

    await store.testSource();

    expect(store.testResult()).toEqual({
      success: false,
      message: 'No se pudo validar la ruta remota',
    });
    expect(feedbackCalls).toEqual([]);
  });

  it('should emit success feedback when the source test succeeds', async () => {
    testImpl = () => of({ success: true, message: 'Fuente OK' });

    await store.testSource();

    expect(store.testResult()).toEqual({ success: true, message: 'Fuente OK' });
    expect(feedbackCalls).toEqual(['tested:entities.source']);
  });
});
