import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuditRecord } from '../models/audit.models';

export interface AuditPageResponse {
  total: number;
  items: AuditRecord[];
  eventTypeOptions: string[];
}

export interface AuditQueryParams {
  search?: string;
  eventType?: string;
  status?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private readonly http = inject(HttpClient);

  list(params: AuditQueryParams): Observable<AuditPageResponse> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 8));

    if (params.search?.trim()) {
      httpParams = httpParams.set('q', params.search.trim());
    }
    if (params.eventType && params.eventType !== 'ALL') {
      httpParams = httpParams.set('eventType', params.eventType);
    }
    if (params.status && params.status !== 'ALL') {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http.get<AuditPageResponse>('/api/query/audit-events', { params: httpParams });
  }
}
