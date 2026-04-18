import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import {
  AppFeedbackService,
  ConnectionManagerService,
} from '@integration-hub/core/services';

import { ConnectionApiService } from '../api/connection-api.service';
import { ConnectionCatalogCommandService } from './connection-catalog-command.service';
import { ConnectionCatalogQueryStore } from './connection-catalog-query.store';
import { ConnectionEditorStateService } from '../editor/connection-editor-state.service';

describe('ConnectionCatalogCommandService', () => {
  let service: ConnectionCatalogCommandService;
  let reload: ReturnType<typeof vi.fn>;
  let feedbackCalls: string[];

  beforeEach(() => {
    reload = vi.fn().mockResolvedValue(undefined);
    feedbackCalls = [];

    TestBed.configureTestingModule({
      providers: [
        ConnectionCatalogCommandService,
        ConnectionEditorStateService,
        {
          provide: ConnectionCatalogQueryStore,
          useValue: {
            markSelectedConnection: vi.fn(),
            openDrawer: vi.fn(),
            reload,
          },
        },
        {
          provide: ConnectionApiService,
          useValue: {
            create: () =>
              of({
                id: 5,
                name: 'connection-b',
                connectionType: 'POSTGRESQL',
                active: true,
                configurationJson: '{}',
              }),
            setActive: () =>
              of({
                id: 5,
                name: 'connection-b',
                connectionType: 'POSTGRESQL',
                active: false,
                configurationJson: '{}',
              }),
            test: () => of({ success: true, message: 'ok' }),
          },
        },
        {
          provide: ConnectionManagerService,
          useValue: {
            createDraftFor: () => ({ type: 'POSTGRESQL' }),
            hydrateDraft: () => ({ type: 'POSTGRESQL' }),
            serializeDraft: () => '{}',
          },
        },
        {
          provide: AppFeedbackService,
          useValue: {
            created: () => feedbackCalls.push('created'),
            testSuccess: () => feedbackCalls.push('testSuccess'),
          },
        },
      ],
    });

    service = TestBed.inject(ConnectionCatalogCommandService);
  });

  it('should save a connection and reload the query', async () => {
    await service.save();

    expect(reload).toHaveBeenCalled();
    expect(feedbackCalls).toEqual(['created']);
  });
});
