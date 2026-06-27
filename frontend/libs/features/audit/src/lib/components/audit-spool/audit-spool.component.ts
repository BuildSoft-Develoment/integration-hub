// @trace observabilidad: operacion del spool asincronico de auditoria
import { CommonModule } from '@angular/common';
import { Component, effect, OnInit, computed, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActionDispatcherService, RelativeTimePipe } from '@integration-hub/shared/ui';
import { AuthAccessService, BreadcrumbService, I18nService } from '@integration-hub/core/services';
import { forkJoin } from 'rxjs';
import { AuditApiService } from '../../api/audit-api.service';
import { AuditSpoolEntry, AuditSpoolSummary } from '../../models/audit.models';
import { AuditOperationRisk, auditEvidenceLabelKey, auditOperationRisk } from '../../utils/audit-operation-risk';
import { AuditWorkspaceNavComponent } from '../audit-workspace-nav/audit-workspace-nav.component';

@Component({
  selector: 'ih-audit-spool',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    AuditWorkspaceNavComponent,
    RelativeTimePipe,
  ],
  styleUrl: './audit-spool.component.css',
  templateUrl: './audit-spool.component.html',
})
export class AuditSpoolComponent implements OnInit {
  private readonly api = inject(AuditApiService);
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly access = inject(AuthAccessService);
  readonly i18n = inject(I18nService);
  readonly actions = inject(ActionDispatcherService);
  readonly canAuditAdmin = this.access.canAuditAdmin;
  readonly cleanupRisk = auditOperationRisk('audit-spool-cleanup-sent');
  readonly retryRisk = auditOperationRisk('audit-spool-retry-dead');

  readonly summary = signal<AuditSpoolSummary | null>(null);
  readonly deadRows = signal<AuditSpoolEntry[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly lastRefresh = signal<string | null>(null);

  deadLimit = 100;
  retentionDays = 7;
  cleanupLimit = 10000;

  // Auto-refresh del backbone asincronico (apagado por defecto).
  readonly autoRefresh = signal(false);
  readonly refreshMs = signal(30000);

  constructor() {
    effect((onCleanup) => {
      if (!this.autoRefresh()) { return; }
      const id = setInterval(() => {
        if (!this.loading()) { this.load(); }
      }, this.refreshMs());
      onCleanup(() => clearInterval(id));
    });
  }

  // Semaforo de salud: DEAD>0 critico, cola estancada (>5min) advertencia, vacia sana.
  readonly health = computed<'ok' | 'warn' | 'error' | null>(() => {
    const s = this.summary();
    if (!s) {
      return null;
    }
    if (s.dead > 0) {
      return 'error';
    }
    if (this.isStale(s.oldestPendingCreatedAt)) {
      return 'warn';
    }
    if (s.pending === 0 && s.inFlight === 0) {
      return 'ok';
    }
    return null;
  });

  readonly healthLabel = computed(() => {
    switch (this.health()) {
      case 'error':
        return this.i18n.t('audit.spool.healthError', { count: this.summary()?.dead ?? 0 });
      case 'warn':
        return this.i18n.t('audit.spool.healthWarn');
      case 'ok':
        return this.i18n.t('audit.spool.healthOk');
      default:
        return '';
    }
  });

  ngOnInit(): void {
    this.breadcrumb.setItems([
      { label: this.i18n.t('audit.breadcrumb.root'), link: ['/audit'] },
      { label: this.i18n.t('audit.breadcrumb.spool') },
    ]);
    this.breadcrumb.setBackLabel(this.i18n.t('audit.common.back'));
    this.load();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('ih-audit-spool')) {
      this.actions.disarm();
    }
  }

  ngOnDestroy(): void {
    this.actions.disarm();
  }

  evidenceText(risk: AuditOperationRisk): string {
    return risk.evidence.map((item) => this.i18n.t(auditEvidenceLabelKey(item))).join(' · ');
  }

  setAutoRefresh(on: boolean): void {
    this.autoRefresh.set(on);
  }

  setRefreshMs(ms: number): void {
    this.refreshMs.set(ms);
  }

  private isStale(ts: string | null | undefined): boolean {
    if (!ts) {
      return false;
    }
    const parsed = Date.parse(ts);
    return Number.isFinite(parsed) && Date.now() - parsed > 5 * 60_000;
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      summary: this.api.auditSpoolSummary(),
      deadRows: this.api.auditSpoolDead(this.deadLimitNumber()),
    }).subscribe({
      next: ({ summary, deadRows }) => {
        this.summary.set(summary);
        this.deadRows.set(deadRows);
        this.lastRefresh.set(new Date().toISOString());
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('audit.spool.loadError'));
        this.loading.set(false);
      },
    });
  }

  loadDead(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.auditSpoolDead(this.deadLimitNumber()).subscribe({
      next: (rows) => {
        this.deadRows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('audit.spool.loadDeadError'));
        this.loading.set(false);
      },
    });
  }

  confirmCleanup(): void {
    if (!this.canAuditAdmin()) {
      return;
    }
    if (this.actions.dispatch({ id: 'spool:cleanup', severity: 'danger' })) {
      this.cleanupSent();
    }
  }

  confirmRetry(row: AuditSpoolEntry): void {
    if (!this.canAuditAdmin()) {
      return;
    }
    if (this.actions.dispatch({ id: `spool:retry:${row.id}`, severity: 'danger' })) {
      this.retry(row);
    }
  }

  retry(row: AuditSpoolEntry): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.retryAuditSpool(row.id).subscribe({
      next: () => {
        this.message.set(this.i18n.t('audit.spool.retryOk', { id: row.id }));
        this.load();
      },
      error: () => {
        this.error.set(this.i18n.t('audit.spool.retryError', { id: row.id }));
        this.loading.set(false);
      },
    });
  }

  cleanupSent(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.cleanupAuditSpoolSent(this.numberOr(this.retentionDays, 7), this.numberOr(this.cleanupLimit, 10000)).subscribe({
      next: (result) => {
        this.message.set(this.i18n.t('audit.spool.cleanupOk', { count: result.deleted }));
        this.load();
      },
      error: () => {
        this.error.set(this.i18n.t('audit.spool.cleanupError'));
        this.loading.set(false);
      },
    });
  }

  private deadLimitNumber(): number {
    return this.numberOr(this.deadLimit, 100);
  }

  private numberOr(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
