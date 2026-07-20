import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import {
  AppFeedbackService,
  AuthService,
} from '@integration-hub/core/services';
import { AuthAccessService } from '@integration-hub/core/services';
import { SourceManagerService } from '@integration-hub/core/services';
import { SourceDraft } from '@integration-hub/core/providers';

// Internal imports (within the same library)
import { SourceCatalogStore } from './source-catalog.store';
import { SourceCatalogCommandService } from './source-catalog-command.service';
import { SourceCatalogQueryStore } from './source-catalog-query.store';
import { SourceApiService } from '../api/source-api.service';
import { SourceEditorStateService } from '../editor/source-editor-state.service';

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
        SourceCatalogQueryStore,
        SourceCatalogCommandService,
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
    // El store LOCALIZA el mensaje de exito (commit 36a75452): ignora el mensaje crudo de la API y usa el
    // texto localizado; el detalle de la API solo se usa en el caso de error.
    testImpl = () => of({ success: true, message: 'Fuente OK' });

    await store.testSource();

    expect(store.testResult()).toEqual({ success: true, message: 'La configuración de la fuente es válida.' });
    expect(feedbackCalls).toEqual(['tested:entities.source']);
  });
});
