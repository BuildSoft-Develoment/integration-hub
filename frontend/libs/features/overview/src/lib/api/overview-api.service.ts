import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { OverviewSummaryRecord } from '../models/overview.models';

@Injectable({ providedIn: 'root' })
export class OverviewApiService {
  private readonly http = inject(HttpClient);

  getSummary(): Observable<OverviewSummaryRecord> {
    return this.http.get<OverviewSummaryRecord>('/api/query/overview-summary');
  }
}
