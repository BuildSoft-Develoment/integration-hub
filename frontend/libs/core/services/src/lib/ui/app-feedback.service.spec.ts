import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { I18nService } from '@integration-hub/core/i18n';
import { AppFeedbackService } from './app-feedback.service';
import { UiMessageService } from './ui-message.service';

describe('AppFeedbackService', () => {
  let service: AppFeedbackService;
  let calls: unknown[] = [];

  beforeEach(() => {
    calls = [];

    TestBed.configureTestingModule({
      providers: [
        AppFeedbackService,
        I18nService,
        {
          provide: UiMessageService,
          useValue: {
            show: (value: unknown) => calls.push(value),
          },
        },
      ],
    });

    service = TestBed.inject(AppFeedbackService);
  });

  it('should emit a success message for created entities', () => {
    service.created('entities.connection');

    expect(calls).toEqual([
      {
        kind: 'success',
        messageKey: 'feedback.created',
        vars: { entity: 'conexion' },
      },
    ]);
  });

  it('should prefer backend details when handling http errors', () => {
    service.handleHttpError(
      new HttpErrorResponse({
        status: 500,
        error: { details: 'Cannot test JDBC connection' },
      })
    );

    expect(calls).toEqual([
      {
        kind: 'error',
        message: 'Cannot test JDBC connection',
      },
    ]);
  });
});
