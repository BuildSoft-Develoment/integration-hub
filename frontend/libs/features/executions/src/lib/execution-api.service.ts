import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProcessExecutionRecord, ProcessTaskExecutionRecord } from './execution.models';

@Injectable({ providedIn: 'root' })
export class ExecutionApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/query/process-executions';

  list(params: { status?: string | null; page?: number; size?: number }): Observable<ProcessExecutionRecord[]> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    query.set('page', String(params.page ?? 0));
    query.set('size', String(params.size ?? 100));
    return this.http.get<ProcessExecutionRecord[]>(`${this.baseUrl}?${query.toString()}`);
  }

  get(executionId: number): Observable<ProcessExecutionRecord> {
    return this.http.get<ProcessExecutionRecord>(`${this.baseUrl}/${executionId}`);
  }

  listTasks(executionId: number): Observable<ProcessTaskExecutionRecord[]> {
    return this.http.get<ProcessTaskExecutionRecord[]>(`${this.baseUrl}/${executionId}/tasks`);
  }
}
