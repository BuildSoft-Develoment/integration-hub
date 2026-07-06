import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/** Petición opcional para disparar una ejecución (body opcional del endpoint POST /api/process-executions/{id}). */
export interface ExecuteProcessRequest {
  executionVariables?: Record<string, string>;
  selectedFiles?: string[];
  sourceExecutionId?: number | null;
}

/** Respuesta del arranque de una ejecución (espejo del backend `ProcessExecutionStartResponse`). */
export interface ProcessExecutionStartResponse {
  id: number;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  sourceExecutionId: number | null;
  triggerSource: string | null;
  details: string | null;
}

/**
 * v60-fix (#5) — data-access COMPARTIDO para disparar la ejecución de un proceso
 * (`POST /api/process-executions/{id}`).
 *
 * <p>Vive en core (capa baja) porque tres features necesitan la MISMA operación (processes, executions,
 * schedules): <b>DIP</b> — las features dependen de esta abstracción de la capa estable, no una de otra. El endpoint
 * backend es único y con <b>body opcional</b>, por eso {@code request} es opcional: cubre el disparo simple ({@code {}})
 * y el retry con parámetros ({@code selectedFiles}/{@code sourceExecutionId}). Antes esta operación estaba triplicada
 * (dos api services de feature + un POST inline en schedules) con dos tipos de respuesta del mismo payload.</p>
 */
@Injectable({ providedIn: 'root' })
export class ProcessExecutionApiService {
  private readonly http = inject(HttpClient);

  execute(
    processDefinitionId: number,
    request?: ExecuteProcessRequest
  ): Observable<ProcessExecutionStartResponse> {
    return this.http.post<ProcessExecutionStartResponse>(
      `/api/process-executions/${processDefinitionId}`,
      request ?? {}
    );
  }
}
