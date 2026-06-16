import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuditRecord,
  AuditSpoolCleanupResult,
  AuditSpoolEntry,
  AuditSpoolSummary,
  Mt101FailedRecord,
  Mt101FragmentLink,
  Mt101FragmentSetSummary,
  Mt101QuarantineBuildResult,
  Mt101RebuildResult,
  Mt101ReprocessResult,
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
    sourceFileHash?: string;
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
    if (query.sourceFileHash?.trim()) {
      httpParams = httpParams.set('sourceFileHash', query.sourceFileHash.trim());
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

  /** Resumen del lote: total de fragmentos + conteo por estado. */
  mt101FragmentSetSummary(query: { connectionRef?: string; fragmentSetId: string }): Observable<Mt101FragmentSetSummary> {
    let httpParams = new HttpParams().set('fragmentSetId', query.fragmentSetId);
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.get<Mt101FragmentSetSummary>('/api/query/mt101-fragments/summary', { params: httpParams });
  }

  /** Revalida/reenvia en bloque por transicion de estado (REJECTED -> BUILT, SENT -> ARCHIVED). */
  mt101ReprocessByStatus(query: {
    connectionRef?: string;
    fragmentSetId: string;
    fromStatus: string;
    toStatus: string;
  }): Observable<Mt101ReprocessResult> {
    let httpParams = new HttpParams()
      .set('fragmentSetId', query.fragmentSetId)
      .set('fromStatus', query.fromStatus)
      .set('toStatus', query.toStatus);
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.post<Mt101ReprocessResult>('/api/query/mt101-fragments/reprocess/status', {}, {
      params: httpParams,
    });
  }

  /** Reprocesa solo los fragmentos que contienen las filas [recordFrom, recordTo] del archivo. */
  mt101ReprocessBySourceRows(query: {
    connectionRef?: string;
    fragmentSetId: string;
    recordFrom: number | string;
    recordTo?: number | string;
    sourceFileHash?: string;
    toStatus?: string;
  }): Observable<Mt101FragmentLink[]> {
    let httpParams = new HttpParams()
      .set('fragmentSetId', query.fragmentSetId)
      .set('recordFrom', String(query.recordFrom))
      .set('toStatus', query.toStatus ?? 'BUILT');
    if (query.recordTo !== undefined && String(query.recordTo).trim()) {
      httpParams = httpParams.set('recordTo', String(query.recordTo).trim());
    }
    if (query.sourceFileHash?.trim()) {
      httpParams = httpParams.set('sourceFileHash', query.sourceFileHash.trim());
    }
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.post<Mt101FragmentLink[]>('/api/query/mt101-fragments/reprocess/source-rows', {}, {
      params: httpParams,
    });
  }

  /** Lista las filas en cuarentena de un set (la fila exacta que fallo, regla, :20:/:21:). */
  mt101FailedRecords(query: {
    connectionRef?: string;
    fragmentSetId: string;
    status?: string;
    limit?: number;
  }): Observable<Mt101FailedRecord[]> {
    let httpParams = new HttpParams()
      .set('fragmentSetId', query.fragmentSetId)
      .set('limit', String(query.limit ?? 500));
    if (query.status?.trim()) {
      httpParams = httpParams.set('status', query.status.trim());
    }
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.get<Mt101FailedRecord[]>('/api/query/mt101-quarantine', { params: httpParams });
  }

  /** Construye la cuarentena resolviendo cada :21: fallido a su fila exacta del archivo. */
  mt101BuildQuarantine(query: {
    connectionRef?: string;
    fragmentSetId: string;
    issueTable?: string;
  }): Observable<Mt101QuarantineBuildResult> {
    let httpParams = new HttpParams().set('fragmentSetId', query.fragmentSetId);
    if (query.issueTable?.trim()) {
      httpParams = httpParams.set('issueTable', query.issueTable.trim());
    }
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.post<Mt101QuarantineBuildResult>('/api/query/mt101-quarantine/build', {}, {
      params: httpParams,
    });
  }

  /** Reconstruye SOLO las filas en cuarentena en un set correctivo (supersede originales). */
  mt101RebuildQuarantine(query: {
    connectionRef?: string;
    fragmentSetId: string;
    correctiveSetId: string;
  }): Observable<Mt101RebuildResult> {
    let httpParams = new HttpParams()
      .set('fragmentSetId', query.fragmentSetId)
      .set('correctiveSetId', query.correctiveSetId);
    if (query.connectionRef?.trim()) {
      httpParams = httpParams.set('connectionRef', query.connectionRef.trim());
    }
    return this.http.post<Mt101RebuildResult>('/api/query/mt101-quarantine/rebuild', {}, {
      params: httpParams,
    });
  }
}
