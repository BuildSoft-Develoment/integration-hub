import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  AppFeedbackService,
  AuthAccessService,
  AuthService,
  ReaderManagerService,
} from '@integration-hub/core/services';
import { ReaderDraft } from '@integration-hub/core/providers';
import { ReaderCatalogStore } from '../../../../libs/features/readers/src/lib/reader-catalog.store';
import { ReaderApiService } from '../../../../libs/features/readers/src/lib/reader-api.service';
import { ReaderEditorStateService } from '../../../../libs/features/readers/src/lib/reader-editor-state.service';

describe('ReaderCatalogStore', () => {
  let store: ReaderCatalogStore;
  let feedbackCalls: string[] = [];

  const txtDraft: ReaderDraft = {
    type: 'TXT',
    mode: 'delimited',
    delimiter: '|',
    encoding: 'UTF-8',
    rowData: '1',
    fields: [
      { name: 'codigo', position: '1', type: 'TEXT', size: '', required: false, defaultValue: '', script: '', pattern: '' },
    ],
    fixedFields: [],
  };

  beforeEach(() => {
    feedbackCalls = [];

    TestBed.configureTestingModule({
      providers: [
        ReaderCatalogStore,
        ReaderEditorStateService,
        {
          provide: ReaderApiService,
          useValue: {
            list: () => of({ items: [], total: 0 }),
            create: () =>
              of({
                id: 1,
                name: 'reader-demo',
                readerType: 'TXT',
                active: true,
                configurationJson: '{}',
              }),
            update: () =>
              of({
                id: 1,
                name: 'reader-demo',
                readerType: 'TXT',
                active: true,
                configurationJson: '{}',
              }),
            setActive: () =>
              of({
                id: 1,
                name: 'reader-demo',
                readerType: 'TXT',
                active: false,
                configurationJson: '{}',
              }),
          },
        },
        {
          provide: ReaderManagerService,
          useValue: {
            createDraftFor: () => ({ ...txtDraft }),
            hydrateDraft: () => ({ ...txtDraft }),
            serializeDraft: () => JSON.stringify({ delimiter: txtDraft.delimiter }),
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
            created: (entityKey: string) => feedbackCalls.push(`created:${entityKey}`),
            updated: (entityKey: string) => feedbackCalls.push(`updated:${entityKey}`),
            activated: (entityKey: string) => feedbackCalls.push(`activated:${entityKey}`),
            deactivated: (entityKey: string) => feedbackCalls.push(`deactivated:${entityKey}`),
          },
        },
      ],
    });

    store = TestBed.inject(ReaderCatalogStore);
  });

  it('should emit created feedback when a reader is created', async () => {
    store.patchForm({ name: 'reader-demo' });

    await store.save();

    expect(feedbackCalls).toEqual(['created:entities.reader']);
  });

  it('should emit deactivated feedback when a reader is disabled', async () => {
    await store.toggleActive({
      id: 99,
      name: 'reader-demo',
      readerType: 'TXT',
      active: true,
      configurationJson: '{}',
    });

    expect(feedbackCalls).toEqual(['deactivated:entities.reader']);
  });
});
