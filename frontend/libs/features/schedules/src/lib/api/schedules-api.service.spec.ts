import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SchedulesApiService } from './schedules-api.service';

describe('SchedulesApiService', () => {
  let service: SchedulesApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SchedulesApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(SchedulesApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  // Regression del refactor "opcion B": execute() dispara la ejecucion con un POST directo
  // (antes delegaba en ProcessApiService de features/processes). El contrato HTTP debe ser identico:
  // POST /api/process-executions/{id} con cuerpo {}.
  it('should trigger a process execution with a direct POST and empty body', () => {
    service.execute(3).subscribe();

    const request = httpTesting.expectOne('/api/process-executions/3');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({ id: 42, status: 'QUEUED' });
  });

  it('should build list query params and omit ALL sentinels', () => {
    service
      .list({
        search: '  daily  ',
        mode: 'ALL',
        status: 'ACTIVE',
        page: 2,
        size: 25,
      })
      .subscribe();

    const request = httpTesting.expectOne((candidate) => {
      const params = candidate.params;
      return (
        candidate.method === 'GET' &&
        candidate.url === '/api/query/process-schedules' &&
        params.get('q') === 'daily' &&
        !params.has('mode') &&
        params.get('status') === 'ACTIVE' &&
        params.get('page') === '2' &&
        params.get('size') === '25'
      );
    });
    request.flush({ total: 0, items: [] });
  });

  it('should apply default pagination when page and size are absent', () => {
    service.list({}).subscribe();

    const request = httpTesting.expectOne((candidate) => {
      const params = candidate.params;
      return (
        candidate.url === '/api/query/process-schedules' &&
        params.get('page') === '0' &&
        params.get('size') === '8' &&
        !params.has('q')
      );
    });
    request.flush({ total: 0, items: [] });
  });
});
