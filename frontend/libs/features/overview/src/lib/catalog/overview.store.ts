import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AppFeedbackService } from '@integration-hub/core/services';
import { OverviewApiService } from '../api/overview-api.service';
import { OverviewMetric, OverviewSummaryRecord } from '../models/overview.models';
import { OverviewTableRow } from '../models/overview-row.model';
import { PluginHealth } from '../models/overview-plugin-health.model';

@Injectable()
export class OverviewStore {
  private readonly api = inject(OverviewApiService);
  private readonly feedback = inject(AppFeedbackService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly summary = signal<OverviewSummaryRecord | null>(null);
  readonly pluginHealth = signal<PluginHealth | null>(null);

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
    this.error.set(null);
    // Plugin health is a secondary, non-fatal signal: load it in parallel and never
    // let its failure surface the page-level error or block the summary.
    await Promise.all([this.loadSummary(), this.loadPluginHealth()]);
    this.loading.set(false);
  }

  private async loadSummary(): Promise<void> {
    try {
      this.summary.set(await firstValueFrom(this.api.getSummary()));
    } catch (err) {
      this.error.set('overview.loadError');
      this.feedback.handleHttpError(err as HttpErrorResponse);
    }
  }

  private async loadPluginHealth(): Promise<void> {
    try {
      const [diagnostics, canary] = await Promise.all([
        firstValueFrom(this.api.getPluginDiagnostics()),
        firstValueFrom(this.api.getPluginCanaryMetrics()),
      ]);
      const installed = diagnostics.installed ?? [];
      this.pluginHealth.set({
        active: installed.filter((plugin) => plugin.status === 'ACTIVE').length,
        degraded: installed.filter((plugin) => plugin.status !== 'ACTIVE').length,
        blocked: (canary ?? []).filter((metric) => !metric.promotable).length,
      });
    } catch {
      // Endpoint unavailable or forbidden (non-admin): hide the card, don't error out.
      this.pluginHealth.set(null);
    }
  }

  async refresh(): Promise<void> {
    await this.load();
  }
}
