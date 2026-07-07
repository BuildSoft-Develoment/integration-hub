import { computed, inject, Injectable, signal } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';
import { forkJoin } from 'rxjs';

import { AsyncDlqApiService } from '../../api/async-dlq-api.service';
import { DeadTask, DlqSummary, StalledScatter } from '../../models/async-dlq.models';

/**
 * Dueño de los datos y operaciones de la consola DLQ (SRP): carga (summary/dead/stalled), semáforo de
 * salud, y las acciones mutantes (redrive/requeue). No sabe de presentación, gating de UI ni auto-refresh
 * — eso vive en {@code AsyncDlqComponent}. Alinea F1 con el patrón de stores del resto de la app (F2/F3).
 */
@Injectable()
export class AsyncDlqStore {
  private readonly api = inject(AsyncDlqApiService);
  private readonly i18n = inject(I18nService);

  readonly summary = signal<DlqSummary | null>(null);
  readonly deadRows = signal<DeadTask[]>([]);
  readonly stalledRows = signal<StalledScatter[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly lastRefresh = signal<string | null>(null);

  /** Semáforo: cualquier fila muerta (outbox/inbox) es crítico; scatters estancados, advertencia; limpio, sano. */
  readonly health = computed<'ok' | 'warn' | 'error' | null>(() => {
    const s = this.summary();
    if (!s) {
      return null;
    }
    if (s.outboxDead + s.inboxDead + s.inboxPoison > 0) {
      return 'error';
    }
    return this.stalledRows().length > 0 ? 'warn' : 'ok';
  });

  load(deadLimit: number, stalledMinutes: number): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      summary: this.api.summary(),
      dead: this.api.dead(deadLimit),
      stalled: this.api.stalled(stalledMinutes, 100),
    }).subscribe({
      next: ({ summary, dead, stalled }) => {
        this.summary.set(summary);
        this.deadRows.set(dead);
        this.stalledRows.set(stalled);
        this.lastRefresh.set(new Date().toISOString());
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('executions.dlq.loadError'));
        this.loading.set(false);
      },
    });
  }

  redrive(deadLimit: number, stalledMinutes: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.redriveOutbox(1000).subscribe({
      next: (result) => {
        this.message.set(this.i18n.t('executions.dlq.redriveOk', { count: result.redriven }));
        this.load(deadLimit, stalledMinutes);
      },
      error: () => {
        this.error.set(this.i18n.t('executions.dlq.redriveError'));
        this.loading.set(false);
      },
    });
  }

  requeue(row: StalledScatter, deadLimit: number, stalledMinutes: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.requeue(row.processExecutionId, row.taskDefinitionId).subscribe({
      next: (result) => {
        this.message.set(
          result.requeued
            ? this.i18n.t('executions.dlq.requeueOk', { pe: row.processExecutionId })
            : this.i18n.t('executions.dlq.requeueRejected', { pe: row.processExecutionId }),
        );
        this.load(deadLimit, stalledMinutes);
      },
      error: () => {
        this.error.set(this.i18n.t('executions.dlq.requeueError', { pe: row.processExecutionId }));
        this.loading.set(false);
      },
    });
  }
}
