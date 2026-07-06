import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ExecutionProgress, ProcessExecutionRecord, ProcessTaskExecutionRecord } from '../models/execution.models';

export interface ExecutionPageResponse {
  total: number;
  items: ProcessExecutionRecord[];
}

export type ExecutionModeFilter = 'ALL' | 'MANUAL' | 'SCHEDULED';

@Injectable({ providedIn: 'root' })
export class ExecutionApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/query/process-executions';

  list(params: {
    processDefinitionId?: number | null;
    status?: string | null;
    search?: string;
    mode?: ExecutionModeFilter;
    page?: number;
    size?: number;
  }): Observable<ExecutionPageResponse> {
    const query = new URLSearchParams();
    if (params.processDefinitionId != null) query.set('processDefinitionId', String(params.processDefinitionId));
    if (params.status) query.set('status', params.status);
    if (params.search?.trim()) query.set('q', params.search.trim());
    if (params.mode && params.mode !== 'ALL') query.set('mode', params.mode);
    query.set('page', String(params.page ?? 0));
    query.set('size', String(params.size ?? 8));
    return this.http.get<ExecutionPageResponse>(`${this.baseUrl}?${query.toString()}`);
  }

  get(executionId: number): Observable<ProcessExecutionRecord> {
    return this.http.get<ProcessExecutionRecord>(`${this.baseUrl}/${executionId}`);
  }

  listTasks(executionId: number): Observable<ProcessTaskExecutionRecord[]> {
    return this.http.get<ProcessTaskExecutionRecord[]>(`${this.baseUrl}/${executionId}/tasks`);
  }

  /** Progreso en vivo (scatter + sync + salud del pipeline) para el monitoreo a escala (ADR-015). */
  progress(executionId: number): Observable<ExecutionProgress> {
    return this.http.get<ExecutionProgress>(`${this.baseUrl}/${executionId}/progress`);
  }

  listChildren(executionId: number): Observable<ProcessExecutionRecord[]> {
    return this.http.get<ProcessExecutionRecord[]>(`${this.baseUrl}/${executionId}/children`);
  }
}
