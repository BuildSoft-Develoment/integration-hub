import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuditRecord, RecordLineageEntry } from '../models/audit.models';

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
}
