import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';

import {
  AppFeedbackService,
  SourceManagerService,
} from '@integration-hub/core/services';

import { SourceApiService } from './source-api.service';
import { SourceCatalogCommandService } from './source-catalog-command.service';
import { SourceCatalogQueryStore } from './source-catalog-query.store';
import { SourceEditorStateService } from './source-editor-state.service';

describe('SourceCatalogCommandService', () => {
  let service: SourceCatalogCommandService;
  let reload: ReturnType<typeof vi.fn>;
  let feedbackCalls: string[];
  let testImpl: () => Observable<{ success: boolean; message: string }>;

  beforeEach(() => {
    reload = vi.fn().mockResolvedValue(undefined);
    feedbackCalls = [];
    testImpl = () => of({ success: true, message: 'ok' });

    TestBed.configureTestingModule({
      providers: [
        SourceCatalogCommandService,
        SourceEditorStateService,
        {
          provide: SourceCatalogQueryStore,
          useValue: {
            markSelectedSource: vi.fn(),
            openDrawer: vi.fn(),
            reload,
          },
        },
        {
          provide: SourceApiService,
          useValue: {
            create: () =>
              of({
                id: 2,
                name: 'source-b',
                sourceType: 'FILESYSTEM',
                active: true,
                configurationJson: '{}',
              }),
            test: () => testImpl(),
            setActive: () =>
              of({
                id: 2,
                name: 'source-b',
                sourceType: 'FILESYSTEM',
                active: false,
                configurationJson: '{}',
              }),
          },
        },
        {
          provide: SourceManagerService,
          useValue: {
            createDraftFor: () => ({ type: 'FILESYSTEM' }),
            hydrateDraft: () => ({ type: 'FILESYSTEM' }),
            serializeDraft: () => '{}',
          },
        },
        {
          provide: AppFeedbackService,
          useValue: {
            created: () => feedbackCalls.push('created'),
            deactivated: () => feedbackCalls.push('deactivated'),
            testSuccess: () => feedbackCalls.push('testSuccess'),
          },
        },
      ],
    });

    service = TestBed.inject(SourceCatalogCommandService);
  });

  it('should save a source and reload the query', async () => {
    await service.save();

    expect(reload).toHaveBeenCalled();
    expect(feedbackCalls).toEqual(['created']);
  });

  it('should keep test errors in local editor state', async () => {
    testImpl = () =>
      throwError(
        () =>
          new HttpErrorResponse({
            error: { details: 'remote path failed' },
            status: 400,
            statusText: 'Bad Request',
          })
      );

    await service.testSource();

    expect(TestBed.inject(SourceEditorStateService).testResult()).toEqual({
      success: false,
      message: 'remote path failed',
    });
  });
});
