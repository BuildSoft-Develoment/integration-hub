import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { OverviewApiService } from './overview-api.service';
import { OverviewSummaryRecord } from './overview.models';

@Injectable()
export class OverviewStore {
  private readonly api = inject(OverviewApiService);

  readonly loading = signal(false);
  readonly summary = signal<OverviewSummaryRecord | null>(null);

  readonly metrics = computed(() => {
    const summary = this.summary();
    if (!summary) {
      return [];
    }

    return [
      { key: 'sources', titleKey: 'overview.metric.sources', value: summary.sources.total, detail: summary.sources.active },
      { key: 'readers', titleKey: 'overview.metric.readers', value: summary.readers.total, detail: summary.readers.active },
      { key: 'processes', titleKey: 'overview.metric.processes', value: summary.processes.total, detail: summary.processes.active },
      { key: 'running', titleKey: 'overview.metric.running', value: summary.runningExecutions, detail: summary.failedExecutions },
      { key: 'retry', titleKey: 'overview.metric.retries', value: summary.retryExecutions, detail: summary.completedWithErrorsExecutions },
      { key: 'files', titleKey: 'overview.metric.fileHealth', value: summary.failedProcessedFiles, detail: summary.pendingProcessedFiles },
      { key: 'scheduled', titleKey: 'overview.metric.scheduled', value: summary.scheduledProcesses, detail: null },
    ];
  });

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.summary.set(await firstValueFrom(this.api.getSummary()));
    } finally {
      this.loading.set(false);
    }
  }
}
