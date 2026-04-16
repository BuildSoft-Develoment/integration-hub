import { TestBed } from '@angular/core/testing';

import { SourceManagerService } from '@integration-hub/core/services';

import { SourceEditorStateService } from './source-editor-state.service';

describe('SourceEditorStateService', () => {
  let service: SourceEditorStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SourceEditorStateService,
        {
          provide: SourceManagerService,
          useValue: {
            createDraftFor: (type: string) => ({ type, path: `/tmp/${type.toLowerCase()}` }),
            hydrateDraft: (type: string, configurationJson: string) => ({
              type,
              configurationJson,
            }),
          },
        },
      ],
    });

    service = TestBed.inject(SourceEditorStateService);
  });

  it('should reset test state when the source type changes', () => {
    service.testResult.set({ success: false, message: 'boom' });

    service.updateFormField('sourceType', 'FTP');

    expect(service.form().sourceType).toBe('FTP');
    expect(service.draft()).toEqual({ type: 'FTP', path: '/tmp/ftp' });
    expect(service.testResult()).toBeNull();
  });

  it('should hydrate form and draft when editing an existing source', () => {
    service.startEdit({
      id: 9,
      name: 'Source demo',
      sourceType: 'REST',
      active: true,
      configurationJson: '{"url":"https://example.com"}',
    });

    expect(service.viewMode()).toBe('edit');
    expect(service.formTitle()).toBe('sources.edit');
    expect(service.form().id).toBe(9);
    expect(service.draft()).toEqual({
      type: 'REST',
      configurationJson: '{"url":"https://example.com"}',
    });
  });
});
