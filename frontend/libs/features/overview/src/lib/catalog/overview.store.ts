import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { OverviewApiService } from '../api/overview-api.service';
import { OverviewMetric, OverviewSummaryRecord } from '../models/overview.models';
import { OverviewTableRow } from '../models/overview-row.model';

@Injectable()
export class OverviewStore {
  private readonly api = inject(OverviewApiService);

  readonly loading = signal(false);
  readonly summary = signal<OverviewSummaryRecord | null>(null);

  readonly metrics = computed<OverviewMetric[]>(() => {
    const summary = this.summary();
    if (!summary) {
      return [];
    }

    const plain = (key: string, titleKey: string, value: number, detail: number | null): OverviewMetric => ({
      key,
      titleKey,
      value,
      detail,
      alertLevel: null,
      actionLink: null,
      actionLabelKey: null,
    });

    const failedExec = summary.failedExecutions;
    const failedFiles = summary.failedProcessedFiles;
    const pendingFiles = summary.pendingProcessedFiles;

    return [
      plain('sources', 'overview.metric.sources', summary.sources.total, summary.sources.active),
      plain('readers', 'overview.metric.readers', summary.readers.total, summary.readers.active),
      plain('processes', 'overview.metric.processes', summary.processes.total, summary.processes.active),
      {
        key: 'running',
        titleKey: 'overview.metric.running',
        value: summary.runningExecutions,
        detail: failedExec,
        alertLevel: failedExec > 0 ? 'error' : null,
        actionLink: failedExec > 0 ? ['/executions'] : null,
        actionLabelKey: failedExec > 0 ? 'overview.action.viewExecutions' : null,
      },
      {
        key: 'retry',
        titleKey: 'overview.metric.retries',
        value: summary.retryExecutions,
        detail: summary.completedWithErrorsExecutions,
        alertLevel: summary.retryExecutions > 0 ? 'warn' : null,
        actionLink: null,
        actionLabelKey: null,
      },
      {
        key: 'files',
        titleKey: 'overview.metric.fileHealth',
        value: failedFiles,
        detail: pendingFiles,
        alertLevel: failedFiles > 0 ? 'error' : pendingFiles > 0 ? 'warn' : null,
        actionLink: failedFiles > 0 ? ['/audit'] : null,
        actionLabelKey: failedFiles > 0 ? 'overview.action.viewAudit' : null,
      },
      plain('scheduled', 'overview.metric.scheduled', summary.scheduledProcesses, null),
    ];
  });

  readonly recentExecutionsRows = computed<OverviewTableRow[]>(() =>
    (this.summary()?.recentExecutions ?? []).map((item) => ({
      primary: item.processName,
      secondary: `#${item.id}`,
      status: item.status,
      timestamp: item.startedAt,
    }))
  );

  readonly failedHighlightsRows = computed<OverviewTableRow[]>(() =>
    (this.summary()?.failedExecutionHighlights ?? []).map((item) => ({
      primary: item.processName,
      secondary: `#${item.id}`,
      status: item.status,
      timestamp: item.finishedAt,
    }))
  );

  readonly recentAuditRows = computed<OverviewTableRow[]>(() =>
    (this.summary()?.recentAuditEvents ?? []).map((item) => ({
      primary: item.eventType,
      secondary: item.message || `#${item.id}`,
      status: item.status,
      timestamp: item.createdAt,
    }))
  );

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.summary.set(await firstValueFrom(this.api.getSummary()));
    } finally {
      this.loading.set(false);
    }
  }
}
