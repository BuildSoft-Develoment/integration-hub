import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConnectionRef, ProcessRecord, ReaderRef, SourceRef } from '../models/process.models';

export interface ProcessPageResponse {
  total: number;
  items: ProcessRecord[];
}

export interface ProcessQueryParams {
  search?: string;
  mode?: string;
  status?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class ProcessApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/process-definitions';

  list(params: ProcessQueryParams): Observable<ProcessPageResponse> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 8));

    if (params.search?.trim()) {
      httpParams = httpParams.set('q', params.search.trim());
    }
    if (params.mode && params.mode !== 'ALL') {
      httpParams = httpParams.set('mode', params.mode);
    }
    if (params.status && params.status !== 'ALL') {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http.get<ProcessPageResponse>('/api/query/process-definitions', {
      params: httpParams,
    });
  }

  create(payload: {
    name: string;
    description: string;
    active: boolean;
    scheduled: boolean;
    scheduleEvery: string;
    flowLayoutJson: string | null;
    tasks: Array<{
      taskOrder: number;
      taskType: string;
      sourceDefinitionId: number | null;
      readerDefinitionId: number | null;
      configurationJson: string;
    }>;
  }): Observable<ProcessRecord> {
    return this.http.post<ProcessRecord>(this.baseUrl, payload);
  }

  update(processDefinitionId: number, payload: {
    name: string;
    description: string;
    active: boolean;
    scheduled: boolean;
    scheduleEvery: string;
    flowLayoutJson: string | null;
    tasks: Array<{
      taskOrder: number;
      taskType: string;
      sourceDefinitionId: number | null;
      readerDefinitionId: number | null;
      configurationJson: string;
    }>;
  }): Observable<ProcessRecord> {
    return this.http.put<ProcessRecord>(`${this.baseUrl}/${processDefinitionId}`, payload);
  }

  setActive(processDefinitionId: number, active: boolean): Observable<ProcessRecord> {
    return this.http.post<ProcessRecord>(`${this.baseUrl}/${processDefinitionId}/activation/${active}`, {});
  }

  listSources(): Observable<SourceRef[]> {
    return this.http.get<SourceRef[]>('/api/source-definitions');
  }

  listReaders(): Observable<ReaderRef[]> {
    return this.http.get<ReaderRef[]>('/api/reader-definitions');
  }

  listConnections(): Observable<ConnectionRef[]> {
    return this.http.get<ConnectionRef[]>('/api/connection-definitions');
  }

}
