import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SKIP_GLOBAL_ERROR_FEEDBACK } from '@integration-hub/core/services';
import { SourceRecord, SourceTestResult } from '../models/source.models';

export interface SourcePageResponse {
  total: number;
  items: SourceRecord[];
}

export interface SourceQueryParams {
  search?: string;
  type?: string;
  status?: string;
  direction?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class SourceApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/source-definitions';

  list(params: SourceQueryParams): Observable<SourcePageResponse> {
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
    if (params.direction && params.direction !== 'ALL') {
      httpParams = httpParams.set('direction', params.direction);
    }

    return this.http.get<SourcePageResponse>('/api/query/source-definitions', {
      params: httpParams,
    });
  }

  create(payload: {
    name: string;
    sourceType: string;
    active: boolean;
    configurationJson: string;
    direction: string;
  }): Observable<SourceRecord> {
    return this.http.post<SourceRecord>(this.baseUrl, payload, {
      context: new HttpContext().set(SKIP_GLOBAL_ERROR_FEEDBACK, false),
    });
  }

  update(
    sourceDefinitionId: number,
    payload: {
      name: string;
      sourceType: string;
      active: boolean;
      configurationJson: string;
      direction: string;
    }
  ): Observable<SourceRecord> {
    return this.http.put<SourceRecord>(
      `${this.baseUrl}/${sourceDefinitionId}`,
      payload,
      {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_FEEDBACK, false),
      }
    );
  }

  setActive(sourceDefinitionId: number, active: boolean): Observable<SourceRecord> {
    return this.http.post<SourceRecord>(
      `${this.baseUrl}/${sourceDefinitionId}/activation/${active}`,
      {}
    );
  }

  test(payload: {
    name: string;
    sourceType: string;
    active: boolean;
    configurationJson: string;
  }): Observable<SourceTestResult> {
    return this.http.post<SourceTestResult>(`${this.baseUrl}/test`, payload, {
      context: new HttpContext().set(SKIP_GLOBAL_ERROR_FEEDBACK, true),
    });
  }
}
