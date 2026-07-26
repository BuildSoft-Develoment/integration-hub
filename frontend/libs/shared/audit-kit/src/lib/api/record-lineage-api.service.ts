import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RecordLineageEntry } from '../models/record-lineage.model';

/**
 * Trazabilidad E2E a nivel de registro (GET /api/query/record-lineage): observabilidad generica de
 * plataforma. Compartida (ADR-019) por el core de auditoria (pagina de trazabilidad) y por los packs
 * de estandar que embeben el lineage (p.ej. SWIFT MT101 por fila de origen).
 */
@Injectable({ providedIn: 'root' })
export class RecordLineageApiService {
  private readonly http = inject(HttpClient);

  recordLineage(query: {
    recordId?: string;
    traceId?: string;
    key?: string;
    value?: string;
    sourceFileHash?: string;
    recordNumber?: number | string;
    processExecutionId?: number | string;
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
      // Acota la clave a una ejecucion (desambigua reprocesos del mismo :20:); si no viene, trae todas.
      if (query.processExecutionId !== undefined && String(query.processExecutionId).trim()) {
        httpParams = httpParams.set('processExecutionId', String(query.processExecutionId).trim());
      }
    }
    if (query.sourceFileHash?.trim() && query.recordNumber !== undefined && String(query.recordNumber).trim()) {
      httpParams = httpParams
        .set('sourceFileHash', query.sourceFileHash.trim())
        .set('recordNumber', String(query.recordNumber).trim());
      // B: desambigua reprocesos (mismo archivo+fila en varias ejecuciones).
      if (query.processExecutionId !== undefined && String(query.processExecutionId).trim()) {
        httpParams = httpParams.set('processExecutionId', String(query.processExecutionId).trim());
      }
    }
    return this.http.get<RecordLineageEntry[]>('/api/query/record-lineage', { params: httpParams });
  }
}
