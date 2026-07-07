import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ProcessExecutionApiService } from './process-execution-api.service';

describe('ProcessExecutionApiService', () => {
  let service: ProcessExecutionApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProcessExecutionApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ProcessExecutionApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should POST an empty body when no request is provided (disparo simple)', () => {
    service.execute(5).subscribe();

    const request = httpTesting.expectOne('/api/process-executions/5');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({ id: 42, status: 'QUEUED' });
  });

  it('should POST the provided request body (retry con parámetros)', () => {
    service
      .execute(7, { selectedFiles: ['a.csv'], sourceExecutionId: 99 })
      .subscribe();

    const request = httpTesting.expectOne('/api/process-executions/7');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      selectedFiles: ['a.csv'],
      sourceExecutionId: 99,
    });
    request.flush({ id: 43, status: 'QUEUED' });
  });
});
