import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor (1) proactive refresh', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let authenticated = true;
  let freshTokenCalls = 0;
  let nextToken = 'fresh';

  function configure() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            authenticated: () => authenticated,
            freshToken: async () => {
              freshTokenCalls += 1;
              return nextToken;
            },
          },
        },
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  }

  afterEach(() => httpTesting.verify());

  it('refreshes and attaches a fresh bearer on every request', async () => {
    authenticated = true;
    nextToken = 'fresh';
    freshTokenCalls = 0;
    configure();

    httpClient.get('/api/demo').subscribe();
    await Promise.resolve();

    const request = httpTesting.expectOne('/api/demo');
    expect(freshTokenCalls).toBe(1);
    expect(request.request.headers.get('Authorization')).toBe('Bearer fresh');
    request.flush({});
  });

  it('passes through without Authorization when not authenticated', () => {
    authenticated = false;
    freshTokenCalls = 0;
    configure();

    httpClient.get('/api/demo').subscribe();

    const request = httpTesting.expectOne('/api/demo');
    expect(freshTokenCalls).toBe(0);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('sends no Authorization header when the fresh token is empty', async () => {
    authenticated = true;
    nextToken = '';
    freshTokenCalls = 0;
    configure();

    httpClient.get('/api/demo').subscribe();
    await Promise.resolve();

    const request = httpTesting.expectOne('/api/demo');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
});
