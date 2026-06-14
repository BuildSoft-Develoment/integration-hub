import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuditRecord,
  AuditSpoolCleanupResult,
  AuditSpoolEntry,
  AuditSpoolSummary,
  Mt101FragmentLink,
  RecordLineageEntry,
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

  /** Trazabilidad E2E a nivel de registro: linea de tiempo por recordId, traceId o claves operativas. */
  recordLineage(query: {
    recordId?: string;
    traceId?: string;
    key?: string;
    value?: string;
    sourceFileHash?: string;
    recordNumber?: number | string;
    limit?: number;
  }): Observable<RecordLineageEntry[]> {
    let httpParams = new HttpParams().set('limit', String(query.limit ?? 1000));
    if (query.recordId?.trim()) {
      httpParams = httpParams.set('recordId', query.recordId.trim());
    }
    if (query.traceId?.trim()) {
      httpParams = httpParams.set('traceId', query.traceId.trim());
    }
    if (query.key?.trim() && query.value?.trim()) {
      httpParams = httpParams.set('key', query.key.trim()).set('value', query.value.trim());
    }
    if (query.sourceFileHash?.trim() && query.recordNumber !== undefined && String(query.recordNumber).trim()) {
      httpParams = httpParams
        .set('sourceFileHash', query.sourceFileHash.trim())
        .set('recordNumber', String(query.recordNumber).trim());
    }
    return this.http.get<RecordLineageEntry[]>('/api/query/record-lineage', { params: httpParams });
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

  mt101FragmentLinks(query: {
    connectionRef?: string;
    recordNumber: number | string;
    sourceTable?: string;
    processExecutionId?: number | string;
    fragmentSetId?: string;
    limit?: number;
  }): Observable<Mt101FragmentLink[]> {
    let httpParams = new HttpParams()
      .set('recordNumber', String(query.recordNumber))
      .set('limit', String(query.limit ?? 20));
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    if (query.sourceTable?.trim()) {
      httpParams = httpParams.set('sourceTable', query.sourceTable.trim());
    }
    if (query.processExecutionId !== undefined && String(query.processExecutionId).trim()) {
      httpParams = httpParams.set('processExecutionId', String(query.processExecutionId).trim());
    }
    if (query.fragmentSetId?.trim()) {
      httpParams = httpParams.set('fragmentSetId', query.fragmentSetId.trim());
    }
    return this.http.get<Mt101FragmentLink[]>('/api/query/mt101-fragments/source-row', { params: httpParams });
  }
}
