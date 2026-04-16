import { TestBed } from '@angular/core/testing';

import { ConnectionManagerService } from '@integration-hub/core/services';

import { ConnectionEditorStateService } from './connection-editor-state.service';

describe('ConnectionEditorStateService', () => {
  let service: ConnectionEditorStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConnectionEditorStateService,
        {
          provide: ConnectionManagerService,
          useValue: {
            createDraftFor: (type: string) => ({ type, jdbcUrl: `jdbc:${type.toLowerCase()}://demo` }),
            hydrateDraft: (type: string, configurationJson: string) => ({
              type,
              configurationJson,
            }),
          },
        },
      ],
    });

    service = TestBed.inject(ConnectionEditorStateService);
  });

  it('should clear test state when the connection type changes', () => {
    service.testResult.set({ success: true, message: 'ok' });

    service.updateFormField('connectionType', 'MYSQL');

    expect(service.form().connectionType).toBe('MYSQL');
    expect(service.draft()).toEqual({
      type: 'MYSQL',
      jdbcUrl: 'jdbc:mysql://demo',
    });
    expect(service.testResult()).toBeNull();
  });

  it('should expose detail title after canceling edit mode', () => {
    service.startCreate('POSTGRESQL');
    service.cancelEdit();

    expect(service.viewMode()).toBe('details');
    expect(service.formTitle()).toBe('connections.detail');
  });
});
