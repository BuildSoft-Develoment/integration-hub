import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  AppFeedbackService,
  httpErrorInterceptor,
  SKIP_GLOBAL_ERROR_FEEDBACK,
} from '@integration-hub/core/services';

describe('httpErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let handledErrors = 0;

  beforeEach(() => {
    handledErrors = 0;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AppFeedbackService,
          useValue: {
            handleHttpError: () => {
              handledErrors += 1;
            },
          },
        },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should forward server errors to the feedback service', () => {
    httpClient.get('/api/demo').subscribe({ error: () => undefined });

    const request = httpTesting.expectOne('/api/demo');
    request.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });

    expect(handledErrors).toBe(1);
  });

  it('should skip global feedback when the request opts out', () => {
    httpClient
      .get('/api/demo-local', {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_FEEDBACK, true),
      })
      .subscribe({ error: () => undefined });

    const request = httpTesting.expectOne('/api/demo-local');
    request.flush({ details: 'Local error' }, { status: 400, statusText: 'Bad Request' });

    expect(handledErrors).toBe(0);
  });
});
