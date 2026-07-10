import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { httpErrorInterceptor, SKIP_GLOBAL_ERROR_FEEDBACK } from './http-error.interceptor';
import { AuthService } from '../auth/auth.service';
import { AppFeedbackService } from '../ui/app-feedback.service';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('httpErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let handledErrors = 0;
  let authenticated = true;
  let forceRefreshResult = 'new-token';
  let forceRefreshCalls = 0;

  function configure() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AppFeedbackService,
          useValue: { handleHttpError: () => { handledErrors += 1; } },
        },
        {
          provide: AuthService,
          useValue: {
            authenticated: () => authenticated,
            forceRefresh: async () => { forceRefreshCalls += 1; return forceRefreshResult; },
          },
        },
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    handledErrors = 0;
    authenticated = true;
    forceRefreshResult = 'new-token';
    forceRefreshCalls = 0;
  });

  afterEach(() => httpTesting.verify());

  it('should forward server errors to the feedback service', () => {
    configure();
    httpClient.get('/api/demo').subscribe({ error: () => undefined });

    const request = httpTesting.expectOne('/api/demo');
    request.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });

    expect(handledErrors).toBe(1);
    expect(forceRefreshCalls).toBe(0);
  });

  it('should skip global feedback when the request opts out', () => {
    configure();
    httpClient
      .get('/api/demo-local', { context: new HttpContext().set(SKIP_GLOBAL_ERROR_FEEDBACK, true) })
      .subscribe({ error: () => undefined });

    const request = httpTesting.expectOne('/api/demo-local');
    request.flush({ details: 'Local error' }, { status: 400, statusText: 'Bad Request' });

    expect(handledErrors).toBe(0);
  });

  it('(2) recovers a 401 by forcing a refresh and retrying once, without showing the message', async () => {
    forceRefreshResult = 'new-token';
    configure();
    let succeeded = false;
    httpClient.get('/api/demo').subscribe({ next: () => (succeeded = true) });

    httpTesting.expectOne('/api/demo').flush({}, { status: 401, statusText: 'Unauthorized' });
    await flush();

    const retry = httpTesting.expectOne('/api/demo');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    retry.flush({ ok: true });
    await flush();

    expect(forceRefreshCalls).toBe(1);
    expect(handledErrors).toBe(0);
    expect(succeeded).toBe(true);
  });

  it('(2) shows the message when the forced refresh fails (SSO dead)', async () => {
    forceRefreshResult = '';
    configure();
    httpClient.get('/api/demo').subscribe({ error: () => undefined });

    httpTesting.expectOne('/api/demo').flush({}, { status: 401, statusText: 'Unauthorized' });
    await flush();

    expect(forceRefreshCalls).toBe(1);
    expect(handledErrors).toBe(1);
  });

  it('(2) does not loop: a second 401 after the retry surfaces the message once', async () => {
    forceRefreshResult = 'new-token';
    configure();
    httpClient.get('/api/demo').subscribe({ error: () => undefined });

    httpTesting.expectOne('/api/demo').flush({}, { status: 401, statusText: 'Unauthorized' });
    await flush();

    const retry = httpTesting.expectOne('/api/demo');
    retry.flush({}, { status: 401, statusText: 'Unauthorized' });
    await flush();

    expect(forceRefreshCalls).toBe(1); // no re-refresh
    expect(handledErrors).toBe(1);
  });

  it('does not attempt recovery when not authenticated', () => {
    authenticated = false;
    configure();
    httpClient.get('/api/demo').subscribe({ error: () => undefined });

    httpTesting.expectOne('/api/demo').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(forceRefreshCalls).toBe(0);
    expect(handledErrors).toBe(1);
  });
});
