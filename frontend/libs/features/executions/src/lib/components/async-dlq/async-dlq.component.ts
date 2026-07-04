// @trace observabilidad ADR-015: consola de operaciones DLQ del backbone async (1M+ registros).
import { CommonModule } from '@angular/common';
import { Component, computed, effect, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthAccessService, BreadcrumbService, I18nService } from '@integration-hub/core/services';
import { ActionDispatcherService, RelativeTimePipe } from '@integration-hub/shared/ui';
import { forkJoin } from 'rxjs';

import { AsyncDlqApiService } from '../../api/async-dlq-api.service';
import { DeadTask, DlqSummary, StalledScatter } from '../../models/async-dlq.models';

@Component({
  selector: 'ih-async-dlq',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    RelativeTimePipe,
  ],
  styleUrl: './async-dlq.component.css',
  templateUrl: './async-dlq.component.html',
})
export class AsyncDlqComponent implements OnInit {
  private readonly api = inject(AsyncDlqApiService);
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly access = inject(AuthAccessService);
  readonly i18n = inject(I18nService);
  readonly actions = inject(ActionDispatcherService);

  // Los reads están abiertos a los 5 roles de lectura (la sección ya gatea el acceso); las acciones
  // mutantes (redrive/requeue) el backend las restringe a admin y aquí se ocultan a no-admin.
  readonly canAdmin = this.access.canAdmin;

  readonly summary = signal<DlqSummary | null>(null);
  readonly deadRows = signal<DeadTask[]>([]);
  readonly stalledRows = signal<StalledScatter[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly lastRefresh = signal<string | null>(null);

  deadLimit = 100;
  stalledMinutes = 5;

  // Auto-refresh apagado por defecto (coherente con la consola de spool de auditoría).
  readonly autoRefresh = signal(false);
  readonly refreshMs = signal(30000);

  constructor() {
    effect((onCleanup) => {
      if (!this.autoRefresh()) {
        return;
      }
      const id = setInterval(() => {
        if (!this.loading()) {
          this.load();
        }
      }, this.refreshMs());
      onCleanup(() => clearInterval(id));
    });
  }

  // Semáforo: cualquier fila muerta (outbox/inbox) es crítico; scatters estancados es advertencia; limpio = sano.
  readonly health = computed<'ok' | 'warn' | 'error' | null>(() => {
    const s = this.summary();
    if (!s) {
      return null;
    }
    if (s.outboxDead + s.inboxDead + s.inboxPoison > 0) {
      return 'error';
    }
    if (this.stalledRows().length > 0) {
      return 'warn';
    }
    return 'ok';
  });

  readonly healthLabel = computed(() => {
    const s = this.summary();
    switch (this.health()) {
      case 'error':
        return this.i18n.t('executions.dlq.healthError', {
          count: s ? s.outboxDead + s.inboxDead + s.inboxPoison : 0,
        });
      case 'warn':
        return this.i18n.t('executions.dlq.healthWarn', { count: this.stalledRows().length });
      case 'ok':
        return this.i18n.t('executions.dlq.healthOk');
      default:
        return '';
    }
  });

  ngOnInit(): void {
    this.breadcrumb.setItems([
      { label: this.i18n.t('executions.title'), link: ['/executions'] },
      { label: this.i18n.t('executions.dlq.title') },
    ]);
    this.breadcrumb.setBackLabel(this.i18n.t('executions.dlq.back'));
    this.load();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('ih-async-dlq')) {
      this.actions.disarm();
    }
  }

  ngOnDestroy(): void {
    this.actions.disarm();
  }

  setAutoRefresh(on: boolean): void {
    this.autoRefresh.set(on);
  }

  setRefreshMs(ms: number): void {
    this.refreshMs.set(ms);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      summary: this.api.summary(),
      dead: this.api.dead(this.numberOr(this.deadLimit, 100)),
      stalled: this.api.stalled(this.numberOr(this.stalledMinutes, 5), 100),
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

  confirmRedrive(): void {
    if (!this.canAdmin()) {
      return;
    }
    if (this.actions.dispatch({ id: 'dlq:redrive', severity: 'danger' })) {
      this.redrive();
    }
  }

  confirmRequeue(row: StalledScatter): void {
    if (!this.canAdmin()) {
      return;
    }
    const id = `dlq:requeue:${row.processExecutionId}:${row.taskDefinitionId}`;
    if (this.actions.dispatch({ id, severity: 'danger' })) {
      this.requeue(row);
    }
  }

  requeueArmId(row: StalledScatter): string {
    return `dlq:requeue:${row.processExecutionId}:${row.taskDefinitionId}`;
  }

  private redrive(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.redriveOutbox(1000).subscribe({
      next: (result) => {
        this.message.set(this.i18n.t('executions.dlq.redriveOk', { count: result.redriven }));
        this.load();
      },
      error: () => {
        this.error.set(this.i18n.t('executions.dlq.redriveError'));
        this.loading.set(false);
      },
    });
  }

  private requeue(row: StalledScatter): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.requeue(row.processExecutionId, row.taskDefinitionId).subscribe({
      next: (result) => {
        this.message.set(
          result.requeued
            ? this.i18n.t('executions.dlq.requeueOk', { pe: row.processExecutionId })
            : this.i18n.t('executions.dlq.requeueRejected', { pe: row.processExecutionId }),
        );
        this.load();
      },
      error: () => {
        this.error.set(this.i18n.t('executions.dlq.requeueError', { pe: row.processExecutionId }));
        this.loading.set(false);
      },
    });
  }

  private numberOr(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
