import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuditRecord,
  AuditSpoolCleanupResult,
  AuditSpoolEntry,
  AuditSpoolSummary,
} from '../models/audit.models';

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

  auditSpoolSummary(): Observable<AuditSpoolSummary> {
    return this.http.get<AuditSpoolSummary>('/api/query/audit-spool/summary');
  }

  auditSpoolDead(limit = 100): Observable<AuditSpoolEntry[]> {
    return this.http.get<AuditSpoolEntry[]>('/api/query/audit-spool/dead', {
      params: new HttpParams().set('limit', String(limit)),
    });
  }

  retryAuditSpool(id: number): Observable<void> {
    return this.http.post<void>(`/api/query/audit-spool/${id}/retry`, {});
  }

  cleanupAuditSpoolSent(retentionDays = 7, limit = 10000): Observable<AuditSpoolCleanupResult> {
    return this.http.delete<AuditSpoolCleanupResult>('/api/query/audit-spool/sent', {
      params: new HttpParams()
        .set('retentionDays', String(retentionDays))
        .set('limit', String(limit)),
    });
  }
}
