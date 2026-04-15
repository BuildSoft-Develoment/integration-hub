import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProcessApiService } from '@integration-hub/features/processes';
import { ScheduleRecord } from './schedules.models';

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
  private readonly processApi = inject(ProcessApiService);

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

  execute(processDefinitionId: number): Observable<unknown> {
    return this.processApi.execute(processDefinitionId);
  }
}
