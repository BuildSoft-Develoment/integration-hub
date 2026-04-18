import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SKIP_GLOBAL_ERROR_FEEDBACK } from '@integration-hub/core/services';
import { ConnectionRecord, ConnectionTestResult } from '../models/connection.models';

export interface ConnectionPageResponse {
  total: number;
  items: ConnectionRecord[];
}

export interface ConnectionQueryParams {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class ConnectionApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/connection-definitions';

  list(params: ConnectionQueryParams): Observable<ConnectionPageResponse> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 8));

    if (params.search?.trim()) {
      httpParams = httpParams.set('q', params.search.trim());
    }
    if (params.type && params.type !== 'ALL') {
      httpParams = httpParams.set('type', params.type);
    }
    if (params.status && params.status !== 'ALL') {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http.get<ConnectionPageResponse>('/api/query/connection-definitions', {
      params: httpParams,
    });
  }

  create(payload: {
    name: string;
    connectionType: string;
    active: boolean;
    configurationJson: string;
  }): Observable<ConnectionRecord> {
    return this.http.post<ConnectionRecord>(this.baseUrl, payload);
  }

  update(
    connectionDefinitionId: number,
    payload: {
      name: string;
      connectionType: string;
      active: boolean;
      configurationJson: string;
    }
  ): Observable<ConnectionRecord> {
    return this.http.put<ConnectionRecord>(
      `${this.baseUrl}/${connectionDefinitionId}`,
      payload
    );
  }

  setActive(connectionDefinitionId: number, active: boolean): Observable<ConnectionRecord> {
    return this.http.post<ConnectionRecord>(
      `${this.baseUrl}/${connectionDefinitionId}/activation/${active}`,
      {}
    );
  }

  test(payload: {
    name: string;
    connectionType: string;
    active: boolean;
    configurationJson: string;
  }): Observable<ConnectionTestResult> {
    return this.http.post<ConnectionTestResult>(`${this.baseUrl}/test`, payload, {
      context: new HttpContext().set(SKIP_GLOBAL_ERROR_FEEDBACK, true),
    });
  }
}
