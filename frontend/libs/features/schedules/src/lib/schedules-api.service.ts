import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProcessApiService } from '@integration-hub/features/processes';
import { ScheduleRecord } from './schedules.models';

@Injectable({ providedIn: 'root' })
export class SchedulesApiService {
  private readonly http = inject(HttpClient);
  private readonly processApi = inject(ProcessApiService);

  list(): Observable<ScheduleRecord[]> {
    return this.http.get<ScheduleRecord[]>('/api/process-schedules');
  }

  execute(processDefinitionId: number): Observable<unknown> {
    return this.processApi.execute(processDefinitionId);
  }
}
