import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { SKIP_GLOBAL_ERROR_FEEDBACK } from '@integration-hub/core/services';
import { Observable } from 'rxjs';
import { OverviewSummaryRecord } from '../models/overview.models';
import {
  BackendPluginDiagnosticsRecord,
  PluginCanaryMetricRecord,
} from '../models/overview-plugin-health.model';

@Injectable({ providedIn: 'root' })
export class OverviewApiService {
  private readonly http = inject(HttpClient);

  getSummary(): Observable<OverviewSummaryRecord> {
    return this.http.get<OverviewSummaryRecord>('/api/query/overview-summary');
  }

  getPluginDiagnostics(): Observable<BackendPluginDiagnosticsRecord> {
    return this.http.get<BackendPluginDiagnosticsRecord>('/api/plugins', {
      context: new HttpContext().set(SKIP_GLOBAL_ERROR_FEEDBACK, true),
    });
  }

  getPluginCanaryMetrics(): Observable<readonly PluginCanaryMetricRecord[]> {
    return this.http.get<readonly PluginCanaryMetricRecord[]>('/api/plugins/canary/metrics', {
      context: new HttpContext().set(SKIP_GLOBAL_ERROR_FEEDBACK, true),
    });
  }
}
