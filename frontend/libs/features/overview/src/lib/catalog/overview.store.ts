import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AppFeedbackService } from '@integration-hub/core/services';
import { OverviewApiService } from '../api/overview-api.service';
import {
  OverviewHealthSignal,
  OverviewHealthSummary,
  OverviewKpi,
  OverviewSummaryRecord,
} from '../models/overview.models';
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

  /** Inventario: conteos estables (número grande + total activo). Sin alertas ni acciones. */
  readonly inventory = computed<OverviewKpi[]>(() => {
    const summary = this.summary();
    if (!summary) {
      return [];
    }
    return [
      { key: 'sources', titleKey: 'overview.metric.sources', value: summary.sources.total, activeCount: summary.sources.active },
      { key: 'readers', titleKey: 'overview.metric.readers', value: summary.readers.total, activeCount: summary.readers.active },
      { key: 'processes', titleKey: 'overview.metric.processes', value: summary.processes.total, activeCount: summary.processes.active },
      { key: 'scheduled', titleKey: 'overview.metric.scheduled', value: summary.scheduledProcesses, activeCount: null },
    ];
  });

  /**
   * Señales de salud con conteo (ejecuciones, reintentos, archivos). Cada una expone sus facetas como
   * mini-stats y su severidad agregada; el store es la única fuente de verdad de la severidad.
   */
  readonly healthPrimary = computed<OverviewHealthSignal[]>(() => {
    const summary = this.summary();
    if (!summary) {
      return [];
    }
    const failedExec = summary.failedExecutions;
    const withErrors = summary.completedWithErrorsExecutions;
    const failedFiles = summary.failedProcessedFiles;
    const pendingFiles = summary.pendingProcessedFiles;

    return [
      {
        key: 'executions',
        titleKey: 'overview.exec.title',
        alert: failedExec > 0 ? 'error' : null,
        stats: [
          { labelKey: 'overview.exec.running', value: summary.runningExecutions, tone: 'ok' },
          { labelKey: 'overview.exec.failed', value: failedExec, tone: 'error' },
        ],
        linkRoute: ['/executions'],
        linkLabelKey: 'overview.action.viewExecutions',
      },
      {
        key: 'retries',
        titleKey: 'overview.retries.title',
        // A diferencia del modelo previo, una ejecución completada con errores tambien pide atencion.
        alert: summary.retryExecutions > 0 || withErrors > 0 ? 'warn' : null,
        stats: [
          { labelKey: 'overview.retries.count', value: summary.retryExecutions, tone: 'ok' },
          { labelKey: 'overview.retries.withErrors', value: withErrors, tone: 'warn' },
        ],
        linkRoute: ['/executions'],
        linkLabelKey: 'overview.action.viewExecutions',
      },
      {
        key: 'files',
        titleKey: 'overview.files.title',
        alert: failedFiles > 0 ? 'error' : pendingFiles > 0 ? 'warn' : null,
        stats: [
          { labelKey: 'overview.files.failed', value: failedFiles, tone: 'error' },
          { labelKey: 'overview.files.pending', value: pendingFiles, tone: 'warn' },
        ],
        linkRoute: ['/audit'],
        linkLabelKey: 'overview.action.viewAudit',
      },
    ];
  });

  /**
   * Señales de salud compuestas (desglose multi-faceta): plugins y backbone async. Se ocultan si su
   * fuente no está disponible (plugin health null por rol/endpoint; async sin summary).
   */
  readonly healthComposite = computed<OverviewHealthSignal[]>(() => {
    const signals: OverviewHealthSignal[] = [];
    const plugins = this.pluginHealth();
    if (plugins) {
      signals.push({
        key: 'plugins',
        titleKey: 'overview.plugins.title',
        alert: plugins.degraded > 0 ? 'error' : plugins.blocked > 0 ? 'warn' : null,
        stats: [
          { labelKey: 'overview.plugins.active', value: plugins.active, tone: 'ok' },
          { labelKey: 'overview.plugins.degraded', value: plugins.degraded, tone: 'error' },
          { labelKey: 'overview.plugins.blocked', value: plugins.blocked, tone: 'warn' },
        ],
        linkRoute: ['/plugins'],
        linkLabelKey: 'overview.action.viewPlugins',
      });
    }
    const summary = this.summary();
    if (summary) {
      const dead = summary.asyncDeadLetters;
      const stalled = summary.asyncStalledScatters;
      signals.push({
        key: 'async',
        titleKey: 'overview.async.title',
        alert: dead > 0 ? 'error' : stalled > 0 ? 'warn' : null,
        stats: [
          { labelKey: 'overview.async.dead', value: dead, tone: 'error' },
          { labelKey: 'overview.async.stalled', value: stalled, tone: 'warn' },
        ],
        linkRoute: ['/executions/async-dlq'],
        linkLabelKey: 'overview.async.viewConsole',
      });
    }
    return signals;
  });

  /** Agregado de todas las señales de salud para el banner de estado. */
  readonly healthSummary = computed<OverviewHealthSummary | null>(() => {
    if (!this.summary()) {
      return null;
    }
    const signals = [...this.healthPrimary(), ...this.healthComposite()];
    let critical = 0;
    let warning = 0;
    let stable = 0;
    for (const signal of signals) {
      if (signal.alert === 'error') {
        critical++;
      } else if (signal.alert === 'warn') {
        warning++;
      } else {
        stable++;
      }
    }
    const worst = critical > 0 ? 'error' : warning > 0 ? 'warn' : null;
    return { critical, warning, stable, worst };
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
