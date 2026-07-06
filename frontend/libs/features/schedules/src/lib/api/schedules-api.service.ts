import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProcessExecutionApiService } from '@integration-hub/core/services';
import { ScheduleRecord } from '../models/schedules.models';

export interface SchedulePageResponse {
  total: number;
  items: ScheduleRecord[];
}

export interface ScheduleQueryParams {
  search?: string;
  mode?: string;
  status?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class SchedulesApiService {
  private readonly http = inject(HttpClient);
  private readonly processExecution = inject(ProcessExecutionApiService);

  list(params: ScheduleQueryParams): Observable<SchedulePageResponse> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 8));

    if (params.search?.trim()) {
      httpParams = httpParams.set('q', params.search.trim());
    }
    if (params.mode && params.mode !== 'ALL') {
      httpParams = httpParams.set('mode', params.mode);
    }
    if (params.status && params.status !== 'ALL') {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http.get<SchedulePageResponse>('/api/query/process-schedules', {
      params: httpParams,
    });
  }

  // schedules dispara la ejecucion via el data-access compartido de core (mismo endpoint que processes/executions);
  // DIP: depende de la capa estable, no de otra feature.
  execute(processDefinitionId: number): Observable<unknown> {
    return this.processExecution.execute(processDefinitionId);
  }
}
