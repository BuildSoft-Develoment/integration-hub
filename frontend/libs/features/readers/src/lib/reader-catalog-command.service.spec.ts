import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import {
  AppFeedbackService,
  ReaderManagerService,
} from '@integration-hub/core/services';

import { ReaderApiService } from './reader-api.service';
import { ReaderCatalogCommandService } from './reader-catalog-command.service';
import { ReaderCatalogQueryStore } from './reader-catalog-query.store';
import { ReaderEditorStateService } from './reader-editor-state.service';

describe('ReaderCatalogCommandService', () => {
  let service: ReaderCatalogCommandService;
  let reload: ReturnType<typeof vi.fn>;
  let feedbackCalls: string[];

  beforeEach(() => {
    reload = vi.fn().mockResolvedValue(undefined);
    feedbackCalls = [];

    TestBed.configureTestingModule({
      providers: [
        ReaderCatalogCommandService,
        ReaderEditorStateService,
        {
          provide: ReaderCatalogQueryStore,
          useValue: {
            markSelectedReader: vi.fn(),
            openDrawer: vi.fn(),
            reload,
          },
        },
        {
          provide: ReaderApiService,
          useValue: {
            create: () =>
              of({
                id: 3,
                name: 'reader-b',
                readerType: 'TXT',
                active: true,
                configurationJson: '{}',
              }),
          },
        },
        {
          provide: ReaderManagerService,
          useValue: {
            createDraftFor: () => ({ type: 'TXT' }),
            hydrateDraft: () => ({ type: 'TXT' }),
            serializeDraft: () => '{}',
          },
        },
        {
          provide: AppFeedbackService,
          useValue: {
            created: () => feedbackCalls.push('created'),
          },
        },
      ],
    });

    service = TestBed.inject(ReaderCatalogCommandService);
  });

  it('should save a reader and reload the query', async () => {
    await service.save();

    expect(reload).toHaveBeenCalled();
    expect(feedbackCalls).toEqual(['created']);
  });
});
