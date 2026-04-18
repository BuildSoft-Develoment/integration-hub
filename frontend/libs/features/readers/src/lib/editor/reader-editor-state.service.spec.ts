import { TestBed } from '@angular/core/testing';

import { ReaderManagerService } from '@integration-hub/core/services';

import { ReaderEditorStateService } from './reader-editor-state.service';

describe('ReaderEditorStateService', () => {
  let service: ReaderEditorStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ReaderEditorStateService,
        {
          provide: ReaderManagerService,
          useValue: {
            createDraftFor: (type: string) => ({ type, delimiter: type === 'CSV' ? ',' : '|' }),
            hydrateDraft: (type: string, configurationJson: string) => ({
              type,
              configurationJson,
            }),
          },
        },
      ],
    });

    service = TestBed.inject(ReaderEditorStateService);
  });

  it('should recreate the draft when the reader type changes', () => {
    service.updateFormField('readerType', 'CSV');

    expect(service.form().readerType).toBe('CSV');
    expect(service.draft()).toEqual({
      type: 'CSV',
      delimiter: ',',
    });
  });

  it('should resolve a fallback form and draft from the current selected type', () => {
    service.startCreate('JSON');

    expect(service.resolveSelectedForm(null)).toEqual(
      expect.objectContaining({ id: null, readerType: 'JSON' })
    );
    expect(service.resolveSelectedDraft(null)).toEqual({
      type: 'JSON',
      delimiter: '|',
    });
  });
});
