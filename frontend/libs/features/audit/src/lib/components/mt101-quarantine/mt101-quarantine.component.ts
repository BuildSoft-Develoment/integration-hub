// @trace SWIFT-MT101: cuarentena por fila + rebuild selectivo (reprocesar solo lo necesario)
import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { I18nService } from '@integration-hub/core/services';
import { BreadcrumbComponent, IconComponent, IhBreadcrumbItem } from '@integration-hub/shared/ui';
import { AuditApiService } from '../../api/audit-api.service';
import { Mt101FailedRecord, Mt101FragmentSetSummary, Mt101LoteHeader, Mt101RebuildRunSummary, Mt101RowTimelineEntry } from '../../models/audit.models';
import { durationBetween, timelineStatusIcon, timelineStatusKind } from '../../utils/timeline-format';

@Component({
  selector: 'ih-mt101-quarantine',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ClipboardModule,
    BreadcrumbComponent,
    IconComponent,
  ],
  styleUrl: './mt101-quarantine.component.css',
  templateUrl: './mt101-quarantine.component.html',
})
export class Mt101QuarantineComponent {
  private readonly api = inject(AuditApiService);
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(I18nService);

  protected readonly statusKind = timelineStatusKind;
  protected readonly statusIcon = timelineStatusIcon;

  readonly breadcrumbItems = computed<IhBreadcrumbItem[]>(() => [
    { label: this.i18n.t('audit.breadcrumb.root'), link: ['/audit'] },
    { label: this.i18n.t('audit.breadcrumb.fragments'), link: ['/audit/mt101-fragments'] },
    { label: this.i18n.t('audit.breadcrumb.quarantine') },
  ]);

  /** Duración entre el hito i-1 y el i del timeline operacional (null en el primero). */
  durationAt(index: number): string | null {
    if (index <= 0) {
      return null;
    }
    const list = this.timeline();
    return durationBetween(list[index - 1]?.eventTs, list[index]?.eventTs);
  }

  fragmentSetId = '';
  connectionRef = '';
  correctiveSetId = '';
  processExecutionId = '';
  statusFilter = '';
  sourceFileHashFilter = '';
  sourceRecordNumberFilter = '';
  ruleCodeFilter = '';
  sendersReferenceFilter = '';
  transactionReferenceFilter = '';
  pageSize = 500;
  private afterId = 0;
  private pageStack: number[] = [];
  readonly hasPreviousPage = signal(false);
  readonly hasNextPage = computed(() => this.rows().length >= this.pageSize);
  rebuildRequestReason = '';
  rebuildApprovalReason = '';
  correctionReason = '';
  correctionTicketRef = '';

  constructor() {
    // Entrada unificada: desde la ejecución (?processExecutionId=) o desde el lookup
    // (?fragmentSetId=). Resuelve la cabecera del lote y auto-lista, sin teclear IDs.
    const qp = this.route.snapshot.queryParamMap;
    const presetSet = qp.get('fragmentSetId');
    const presetExec = qp.get('processExecutionId');
    if (presetSet) {
      this.fragmentSetId = presetSet;
    }
    if (presetExec) {
      this.processExecutionId = presetExec;
    }
    if (presetSet || presetExec) {
      this.loadLote();
    }
  }

  loadLote(): void {
    if (!this.fragmentSetId.trim() && !this.processExecutionId.trim()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.mt101Lote({
      fragmentSetId: this.fragmentSetId,
      processExecutionId: this.processExecutionId,
      connectionRef: this.connectionRef,
    }).subscribe({
      next: (header) => {
        this.lote.set(header);
        if (header?.fragmentSetId) {
          this.fragmentSetId = header.fragmentSetId;
          this.correctiveSetId = `${header.fragmentSetId}-FIX`;
        }
        this.list(true);
      },
      error: () => {
        this.error.set(this.i18n.t('audit.quarantine.loteError'));
        this.loading.set(false);
      },
    });
  }

  readonly rows = signal<Mt101FailedRecord[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly summary = signal<Mt101FragmentSetSummary | null>(null);
  readonly lote = signal<Mt101LoteHeader | null>(null);
  readonly selectedRow = signal<number | null>(null);
  readonly timeline = signal<Mt101RowTimelineEntry[]>([]);
  readonly timelineLoading = signal(false);
  readonly correctingRow = signal<number | null>(null);
  correctionPayload = '';
  // Version (ETag) de la fila cargada, para el locking optimista al guardar.
  readonly correctionVersion = signal<number | null>(null);

  // Copia al portapapeles con feedback efimero (CDK Clipboard) para valores
  // truncados como el hash del archivo, reutilizables en el modo Archivo+fila.
  readonly copied = signal<string | null>(null);
  markCopied(key: string): void {
    this.copied.set(key);
    setTimeout(() => {
      if (this.copied() === key) {
        this.copied.set(null);
      }
    }, 1500);
  }

  // Confirmación de acciones críticas: armado 2-pasos para "construir" y panel de
  // impacto para el rebuild (genera lote SWIFT nuevo + supersede de los originales).
  readonly armed = signal<string | null>(null);
  // Flujo gobernado del rebuild (maker-checker): REQUESTED -> APPROVED -> ejecutado.
  // Solicitar no ejecuta; aprobar lo hace un usuario distinto; ejecutar genera el lote.
  readonly rebuildRun = signal<Mt101RebuildRunSummary | null>(null);
  private armTimer?: ReturnType<typeof setTimeout>;

  private arm(id: string, run: () => void): void {
    if (this.armed() === id) {
      this.disarm();
      run();
      return;
    }
    this.armed.set(id);
    if (this.armTimer) {
      clearTimeout(this.armTimer);
    }
    this.armTimer = setTimeout(() => this.armed.set(null), 5000);
  }

  private disarm(): void {
    this.armed.set(null);
    if (this.armTimer) {
      clearTimeout(this.armTimer);
      this.armTimer = undefined;
    }
  }

  confirmBuild(): void {
    this.arm('build', () => this.buildQuarantine());
  }

  /** Paso 1: solicita el rebuild (no ejecuta). Queda REQUESTED para que otro lo apruebe. */
  requestRebuild(): void {
    if (!this.fragmentSetId.trim() || !this.correctiveSetId.trim()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.api.mt101RequestRebuildRun({
      fragmentSetId: this.fragmentSetId,
      correctiveSetId: this.correctiveSetId,
      connectionRef: this.connectionRef,
      reason: this.rebuildRequestReason,
    }).subscribe({
      next: (run) => {
        this.rebuildRun.set(run);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(this.backendError(e, 'audit.quarantine.rebuildError'));
        this.loading.set(false);
      },
    });
  }

  cancelRebuild(): void {
    this.rebuildRun.set(null);
  }

  /** Paso 2: aprueba el run. El backend rechaza si el aprobador es el mismo solicitante. */
  approveRun(): void {
    const run = this.rebuildRun();
    if (!run) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.mt101ApproveRebuildRun({
      rebuildRunId: run.rebuildRunId,
      connectionRef: this.connectionRef,
      reason: this.rebuildApprovalReason,
    }).subscribe({
      next: (updated) => {
        this.rebuildRun.set(updated);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(this.backendError(e, 'audit.quarantine.approveError'));
        this.loading.set(false);
      },
    });
  }

  toggleCorrect(row: Mt101FailedRecord): void {
    if (this.correctingRow() === row.id) {
      this.correctingRow.set(null);
      return;
    }
    this.correctionPayload = '';
    this.correctionReason = '';
    this.correctionTicketRef = '';
    this.correctionVersion.set(null);
    this.correctingRow.set(row.id);
    const sourceFileHash = row.sourceFileHash?.trim();
    if (row.sourceRecordNumber === null || !sourceFileHash) {
      return;
    }
    // Carga el payload actual + version: se edita sobre lo real y habilita el locking optimista.
    this.api.mt101StagingRow({
      fragmentSetId: this.fragmentSetId,
      sourceFileHash,
      recordNumber: row.sourceRecordNumber,
      connectionRef: this.connectionRef,
    }).subscribe({
      next: (view) => {
        if (this.correctingRow() === row.id) {
          this.correctionPayload = view.payloadJson ?? '';
          this.correctionVersion.set(view.version);
        }
      },
      error: () => {
        // Si no se puede cargar (fila purgada, etc.) el operador puede teclear el payload a mano.
      },
    });
  }

  saveCorrection(row: Mt101FailedRecord): void {
    const sourceFileHash = row.sourceFileHash?.trim();
    if (row.sourceRecordNumber === null || !sourceFileHash || !this.correctionPayload.trim()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.mt101CorrectStagingRow({
      fragmentSetId: this.fragmentSetId,
      sourceFileHash,
      recordNumber: row.sourceRecordNumber,
      payload: this.correctionPayload,
      version: this.correctionVersion() ?? undefined,
      connectionRef: this.connectionRef,
      reason: this.correctionReason,
      ticketRef: this.correctionTicketRef,
    }).subscribe({
      next: (result) => {
        this.correctionVersion.set(result.version);
        this.message.set(this.i18n.t('audit.quarantine.correctOk', { row: row.sourceRecordNumber as number }));
        this.correctingRow.set(null);
        this.loading.set(false);
      },
      error: (err: { status?: number }) => {
        this.error.set(err?.status === 409
          ? this.i18n.t('audit.quarantine.correctConflict')
          : this.i18n.t('audit.quarantine.correctError'));
        this.loading.set(false);
      },
    });
  }
  readonly pendingCount = computed(() => this.rows().filter((r) => r.status === 'QUARANTINED').length);

  toggleTimeline(row: Mt101FailedRecord): void {
    if (this.selectedRow() === row.id) {
      this.selectedRow.set(null);
      return;
    }
    const sourceFileHash = row.sourceFileHash?.trim();
    if (row.sourceRecordNumber === null || !sourceFileHash) {
      return;
    }
    this.selectedRow.set(row.id);
    this.timeline.set([]);
    this.timelineLoading.set(true);
    // Timeline operacional: instantáneo desde staging/fragmento/cuarentena (no cold store).
    this.api.mt101RowTimeline({
      fragmentSetId: this.fragmentSetId,
      sourceFileHash,
      recordNumber: row.sourceRecordNumber,
      connectionRef: this.connectionRef,
    }).subscribe({
      next: (entries) => {
        this.timeline.set(entries);
        this.timelineLoading.set(false);
      },
      error: () => this.timelineLoading.set(false),
    });
  }
  readonly statusEntries = computed(() => {
    const s = this.summary();
    return s ? Object.entries(s.byStatus).map(([status, count]) => ({ status, count })) : [];
  });

  private loadSummary(): void {
    if (!this.fragmentSetId.trim()) {
      return;
    }
    this.api.mt101FragmentSetSummary({
      fragmentSetId: this.fragmentSetId,
      connectionRef: this.connectionRef,
    }).subscribe({
      next: (s) => this.summary.set(s),
      error: () => this.summary.set(null),
    });
  }

  list(resetPage = true): void {
    if (!this.fragmentSetId.trim()) {
      return;
    }
    if (resetPage) {
      this.afterId = 0;
      this.pageStack = [];
      this.hasPreviousPage.set(false);
    }
    this.loadSummary();
    this.loading.set(true);
    this.error.set(null);
    this.api.mt101FailedRecords({
      fragmentSetId: this.fragmentSetId,
      connectionRef: this.connectionRef,
      status: this.statusFilter,
      sourceFileHash: this.sourceFileHashFilter,
      sourceRecordNumber: this.sourceRecordNumberFilter,
      ruleCode: this.ruleCodeFilter,
      sendersReference: this.sendersReferenceFilter,
      transactionReference: this.transactionReferenceFilter,
      afterId: this.afterId,
      limit: this.pageSize,
    }).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('audit.quarantine.listError'));
        this.loading.set(false);
      },
    });
  }

  nextPage(): void {
    const rows = this.rows();
    if (!rows.length) {
      return;
    }
    this.pageStack.push(this.afterId);
    this.afterId = rows[rows.length - 1].id;
    this.hasPreviousPage.set(this.pageStack.length > 0);
    this.list(false);
  }

  previousPage(): void {
    if (!this.pageStack.length) {
      return;
    }
    this.afterId = this.pageStack.pop() ?? 0;
    this.hasPreviousPage.set(this.pageStack.length > 0);
    this.list(false);
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.sourceFileHashFilter = '';
    this.sourceRecordNumberFilter = '';
    this.ruleCodeFilter = '';
    this.sendersReferenceFilter = '';
    this.transactionReferenceFilter = '';
    this.list(true);
  }

  buildQuarantine(): void {
    if (!this.fragmentSetId.trim()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.api.mt101BuildQuarantine({
      fragmentSetId: this.fragmentSetId,
      connectionRef: this.connectionRef,
    }).subscribe({
      next: (result) => {
        this.message.set(this.i18n.t('audit.quarantine.buildOk', { count: result.quarantined }));
        this.list();
      },
      error: () => {
        this.error.set(this.i18n.t('audit.quarantine.buildError'));
        this.loading.set(false);
      },
    });
  }

  /** Paso 3: ejecuta el run aprobado (genera el lote correctivo y resuelve la cuarentena del run). */
  executeRun(): void {
    const run = this.rebuildRun();
    if (!run) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.api.mt101ExecuteRebuildRun({ rebuildRunId: run.rebuildRunId, connectionRef: this.connectionRef }).subscribe({
      next: (result) => {
        this.message.set(this.i18n.t('audit.quarantine.rebuildOk', {
          set: result.correctiveSetId,
          rows: result.rebuiltRows,
          superseded: result.supersededFragments,
          fragments: result.fragmentCount,
        }));
        this.rebuildRun.set(null);
        this.list(true);
      },
      error: (e) => {
        this.error.set(this.backendError(e, 'audit.quarantine.rebuildError'));
        this.loading.set(false);
      },
    });
  }

  /** Muestra el mensaje real del backend (p.ej. el de segregación de funciones) o un fallback i18n. */
  private backendError(e: unknown, fallbackKey: string): string {
    const httpError = e as { error?: unknown };
    if (typeof httpError?.error === 'string' && httpError.error.trim()) {
      return httpError.error;
    }
    return this.i18n.t(fallbackKey);
  }
}
