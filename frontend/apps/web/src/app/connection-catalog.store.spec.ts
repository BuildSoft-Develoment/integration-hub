import '../../../../libs/features/connections/src/lib/connection-catalog-command.service.spec';
import '../../../../libs/features/connections/src/lib/connection-catalog-query.store.spec';
import '../../../../libs/features/connections/src/lib/connection-editor-state.service.spec';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import {
  AppFeedbackService,
  AuthAccessService,
  AuthService,
  ConnectionManagerService,
} from '@integration-hub/core/services';
import { ConnectionDraft } from '@integration-hub/core/providers';
import { ConnectionCatalogStore } from '../../../../libs/features/connections/src/lib/connection-catalog.store';
import { ConnectionCatalogCommandService } from '../../../../libs/features/connections/src/lib/connection-catalog-command.service';
import { ConnectionCatalogQueryStore } from '../../../../libs/features/connections/src/lib/connection-catalog-query.store';
import { ConnectionApiService } from '../../../../libs/features/connections/src/lib/connection-api.service';
import { ConnectionEditorStateService } from '../../../../libs/features/connections/src/lib/connection-editor-state.service';

describe('ConnectionCatalogStore', () => {
  let store: ConnectionCatalogStore;
  let api: ConnectionApiService;
  let testImpl: () => any;
  let feedbackCalls: string[] = [];

  const jdbcDraft: ConnectionDraft = {
    type: 'POSTGRESQL',
    family: 'jdbc',
    jdbcUrl: 'jdbc:postgresql://localhost:5432/demo',
    username: 'postgres',
    password: 'secret',
    minSize: '0',
    maxSize: '10',
    acquisitionTimeoutSeconds: '30',
    validationTimeoutSeconds: '5',
    reapTimeoutMinutes: '5',
    initialSql: '',
    jdbcPropertiesJson: '{}',
  };

  beforeEach(() => {
    testImpl = () => of({ success: true, message: 'Conexion OK' });
    api = {
      list: () => of([]),
      create: () => of({ id: 1, name: 'demo', connectionType: 'POSTGRESQL', active: true, configurationJson: '{}' }),
      update: () => of({ id: 1, name: 'demo', connectionType: 'POSTGRESQL', active: true, configurationJson: '{}' }),
      setActive: () => of({ id: 1, name: 'demo', connectionType: 'POSTGRESQL', active: true, configurationJson: '{}' }),
      test: () => testImpl(),
    } as unknown as ConnectionApiService;
    feedbackCalls = [];

    TestBed.configureTestingModule({
      providers: [
        ConnectionCatalogStore,
        ConnectionCatalogQueryStore,
        ConnectionCatalogCommandService,
        ConnectionEditorStateService,
        {
          provide: ConnectionApiService,
          useValue: api,
        },
        {
          provide: ConnectionManagerService,
          useValue: {
            createDraftFor: () => ({ ...jdbcDraft }),
            hydrateDraft: () => ({ ...jdbcDraft }),
            serializeDraft: () => JSON.stringify({ jdbcUrl: jdbcDraft.jdbcUrl }),
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

    store = TestBed.inject(ConnectionCatalogStore);
  });

  it('should keep local test errors inside the panel state', async () => {
    testImpl = () =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { details: 'No se pudo abrir el pool JDBC' },
          })
      );

    await store.testConnection();

    expect(store.testResult()).toEqual({
      success: false,
      message: 'No se pudo abrir el pool JDBC',
    });
    expect(feedbackCalls).toEqual([]);
  });

  it('should emit success feedback when the connection test succeeds', async () => {
    testImpl = () => of({ success: true, message: 'Conexion OK' });

    await store.testConnection();

    expect(store.testResult()).toEqual({ success: true, message: 'Conexion OK' });
    expect(feedbackCalls).toEqual(['tested:entities.connection']);
  });
});

