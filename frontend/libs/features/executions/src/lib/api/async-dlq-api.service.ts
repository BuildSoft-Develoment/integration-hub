import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { DeadTask, DlqSummary, StalledScatter } from '../models/async-dlq.models';

/**
 * Cliente de la API DLQ async (ADR-015). Reads de salud abiertos a los 5 roles de lectura; las
 * acciones mutantes (redrive/requeue) las restringe el backend a admin y la UI las oculta a no-admin.
 */
@Injectable({ providedIn: 'root' })
export class AsyncDlqApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/query/tasks-dlq';

  summary(): Observable<DlqSummary> {
    return this.http.get<DlqSummary>(`${this.baseUrl}/summary`);
  }

  dead(limit = 100): Observable<DeadTask[]> {
    return this.http.get<DeadTask[]>(`${this.baseUrl}/dead`, {
      params: new HttpParams().set('limit', String(limit)),
    });
  }

  stalled(minutes = 5, limit = 100): Observable<StalledScatter[]> {
    return this.http.get<StalledScatter[]>(`${this.baseUrl}/stalled`, {
      params: new HttpParams().set('minutes', String(minutes)).set('limit', String(limit)),
    });
  }

  /** Reanima filas DEAD del outbox a PENDING para que el relay reintente publicarlas. */
  redriveOutbox(limit = 1000): Observable<{ redriven: number }> {
    return this.http.post<{ redriven: number }>(`${this.baseUrl}/outbox/redrive`, null, {
      params: new HttpParams().set('limit', String(limit)),
    });
  }

  /** Re-inyecta la última página de un scatter streaming estancado → reanuda la cadena (idempotente). */
  requeue(processExecutionId: number, taskDefinitionId: number): Observable<{ requeued: boolean }> {
    return this.http.post<{ requeued: boolean }>(
      `${this.baseUrl}/suspensions/${processExecutionId}/${taskDefinitionId}/requeue`,
      null,
    );
  }
}
