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

import { StalledScatter } from '../../models/async-dlq.models';
import { AsyncDlqStore } from './async-dlq.store';

@Component({
  selector: 'ih-async-dlq',
  standalone: true,
  providers: [AsyncDlqStore],
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
  private readonly store = inject(AsyncDlqStore);
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly access = inject(AuthAccessService);
  readonly i18n = inject(I18nService);
  readonly actions = inject(ActionDispatcherService);

  // Los reads están abiertos a los 5 roles de lectura (la sección ya gatea el acceso); las acciones
  // mutantes (redrive/requeue) el backend las restringe a admin y aquí se ocultan a no-admin.
  readonly canAdmin = this.access.canAdmin;

  // El estado y las operaciones viven en el store (SRP); el componente solo re-expone las señales al
  // template y añade la presentación (labels i18n), el gating de acciones y el auto-refresh de UI.
  readonly summary = this.store.summary;
  readonly deadRows = this.store.deadRows;
  readonly stalledRows = this.store.stalledRows;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly message = this.store.message;
  readonly lastRefresh = this.store.lastRefresh;
  readonly health = this.store.health;

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
    this.store.load(this.numberOr(this.deadLimit, 100), this.numberOr(this.stalledMinutes, 5));
  }

  confirmRedrive(): void {
    if (!this.canAdmin()) {
      return;
    }
    if (this.actions.dispatch({ id: 'dlq:redrive', severity: 'danger' })) {
      this.store.redrive(this.numberOr(this.deadLimit, 100), this.numberOr(this.stalledMinutes, 5));
    }
  }

  confirmRequeue(row: StalledScatter): void {
    if (!this.canAdmin()) {
      return;
    }
    if (this.actions.dispatch({ id: this.requeueArmId(row), severity: 'danger' })) {
      this.store.requeue(row, this.numberOr(this.deadLimit, 100), this.numberOr(this.stalledMinutes, 5));
    }
  }

  requeueArmId(row: StalledScatter): string {
    return `dlq:requeue:${row.processExecutionId}:${row.taskDefinitionId}`;
  }

  private numberOr(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
