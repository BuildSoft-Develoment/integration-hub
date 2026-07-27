// @trace SWIFT-MT101: cuarentena por fila + rebuild selectivo (reprocesar solo lo necesario)
import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthAccessService, BreadcrumbService, I18nService } from '@integration-hub/core/services';
import { ActionDispatcherService, ConfirmDialogComponent, IconComponent } from '@integration-hub/shared/ui';
import { Observable } from 'rxjs';
import { Mt101AuditApiService } from '../../api/mt101-audit-api.service';
import { Mt101CorrectionApply, Mt101CorrectionPreview, Mt101CorrectiveLifecycle, Mt101FailedRecord, Mt101FragmentSetSummary, Mt101LoteHeader, Mt101NormalPayResolution, Mt101PayAction, Mt101PayConflict, Mt101RebuildRunSummary, Mt101RowTimelineEntry, Mt101RuleSummary, Mt101StagingRowView } from '../../models/mt101.models';
import {
  AuditOperationRisk,
  AuditWorkspaceNavComponent,
  auditEvidenceLabelKey,
  auditOperationRisk,
  durationBetween,
  timelineStatusIcon,
  timelineStatusKind,
} from '@integration-hub/shared/audit-kit';

@Component({
  selector: 'ih-mt101-quarantine',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ClipboardModule,
    IconComponent,
    AuditWorkspaceNavComponent,
  ],
  styleUrl: './mt101-quarantine.component.css',
  templateUrl: './mt101-quarantine.component.html',
})
export class Mt101QuarantineComponent {
  private readonly api = inject(Mt101AuditApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly dialog = inject(MatDialog);
  private readonly access = inject(AuthAccessService);
  readonly i18n = inject(I18nService);
  readonly canAuditAdmin = this.access.canAuditAdmin;
  readonly canAuditOperate = this.access.canAuditOperate;

  protected readonly statusKind = timelineStatusKind;
  protected readonly statusIcon = timelineStatusIcon;

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
  // P1 v23: evidencia de gobierno del PAY. Obligatorios al solicitar/resolver (no se envia dinero
  // sin justificacion de negocio ni ticket/incidente trazable).
  payRequestReason = '';
  payRequestTicket = '';
  payResolutionReason = '';

  constructor() {
    this.breadcrumb.setItems([
      { label: this.i18n.t('audit.breadcrumb.root'), link: ['/audit'] },
      { label: this.i18n.t('audit.breadcrumb.fragments'), link: ['/audit/mt101-fragments'] },
      { label: this.i18n.t('audit.breadcrumb.quarantine') },
    ]);
    this.breadcrumb.setBackLabel(this.i18n.t('audit.common.back'));
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
  // ADR-020 (A): resumen de la cuarentena por causa (rule_code) — miles de fallos -> un puñado de decisiones.
  readonly causeSummary = signal<Mt101RuleSummary[]>([]);
  // ADR-020 (C1): descarga de la planilla de correccion (XLSX).
  readonly exportingSheet = signal(false);
  // ADR-020 (C2): dry-run del import de la planilla (preview read-only).
  readonly previewingSheet = signal(false);
  readonly correctionPreview = signal<Mt101CorrectionPreview | null>(null);
  // ADR-020 (C3): apply de la planilla ya revisada en el preview. Se guarda el mismo archivo para reenviarlo.
  private lastCorrectionFile: File | null = null;
  readonly applyingSheet = signal(false);
  readonly applyResult = signal<Mt101CorrectionApply | null>(null);
  bulkCorrectionReason = '';
  bulkCorrectionTicketRef = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly summary = signal<Mt101FragmentSetSummary | null>(null);
  // v60: lista detallada de conflictos de pago del set (:20:, estado, motivo, fecha) + resolución manual del UNCERTAIN
  // normal. Complementa el conteo/alerta con la vista accionable (backend ya existente: /pay-conflicts).
  readonly payConflicts = signal<Mt101PayConflict[]>([]);
  readonly payConflictsShown = signal(false);
  readonly lote = signal<Mt101LoteHeader | null>(null);
  readonly selectedRow = signal<number | null>(null);
  readonly timeline = signal<Mt101RowTimelineEntry[]>([]);
  readonly timelineLoading = signal(false);
  readonly correctingRow = signal<number | null>(null);
  correctionPayload = '';
  // Version (ETag) de la fila cargada, para el locking optimista al guardar.
  readonly correctionVersion = signal<number | null>(null);
  // item 2: posición FÍSICA de la fila cargada (línea física, o hoja+fila en Excel) para "qué línea del archivo".
  readonly correctionPosition = signal<Mt101StagingRowView | null>(null);
  // Editor de campos (reemplaza el JSON crudo): un input por clave editable (no-_); los _ internos van read-only.
  // El JSON crudo queda como modo "Avanzado". Al guardar se manda un merge-patch de SOLO los cambios (coercido).
  readonly correctionEditableKeys = signal<string[]>([]);
  correctionEdits: Record<string, string> = {};
  readonly correctionMetaEntries = signal<{ key: string; value: string }[]>([]);
  readonly correctionAdvanced = signal(false);
  private correctionOriginal: Record<string, unknown> = {};
  readonly cargosOptions = ['OUR', 'BEN', 'SHA'];

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

  readonly actions = inject(ActionDispatcherService);
  readonly governedRisks = [
    auditOperationRisk('mt101-quarantine-build'),
    auditOperationRisk('mt101-rebuild-request'),
    auditOperationRisk('mt101-rebuild-approve'),
    auditOperationRisk('mt101-corrective-pay-request'),
    auditOperationRisk('mt101-corrective-pay-approve'),
  ] as const;
  readonly correctionRisk = auditOperationRisk('mt101-correction-save');
  readonly executeRisk = auditOperationRisk('mt101-rebuild-execute');
  readonly uncertainPayRisk = auditOperationRisk('mt101-pay-uncertain-resolve');
  // Flujo gobernado del rebuild (maker-checker): REQUESTED -> APPROVED -> ejecutado.
  // Solicitar no ejecuta; aprobar lo hace un usuario distinto; ejecutar genera el lote.
  readonly rebuildRun = signal<Mt101RebuildRunSummary | null>(null);
  readonly rebuildRuns = signal<Mt101RebuildRunSummary[]>([]);

  evidenceText(risk: AuditOperationRisk): string {
    return risk.evidence.map((item) => this.i18n.t(auditEvidenceLabelKey(item))).join(' · ');
  }

  confirmBuild(): void {
    if (!this.canAuditOperate()) {
      return;
    }
    if (this.actions.dispatch({ id: 'quarantine:build', severity: 'danger' })) {
      this.buildQuarantine();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('ih-mt101-quarantine')) {
      this.actions.disarm();
    }
  }

  /** Paso 1: solicita el rebuild (no ejecuta). Queda REQUESTED para que otro lo apruebe. */
  requestRebuild(): void {
    if (!this.canAuditOperate()) {
      return;
    }
    if (!this.fragmentSetId.trim()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    // B1: el correctiveSetId lo genera el servidor y vuelve en el summary (run.correctiveSetId).
    this.api.mt101RequestRebuildRun({
      fragmentSetId: this.fragmentSetId,
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

  /** B1': reabre una fila REBUILD_REJECTED para corregir y reconstruir de nuevo. */
  reopenRejected(row: Mt101FailedRecord): void {
    if (!this.canAuditOperate()) {
      return;
    }
    const sourceFileHash = row.sourceFileHash?.trim();
    if (row.sourceRecordNumber === null || row.stagingId === null || !sourceFileHash) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.api.mt101ReopenRejected({
      fragmentSetId: this.fragmentSetId,
      sourceFileHash,
      recordNumber: row.sourceRecordNumber,
      stagingId: row.stagingId,
      connectionRef: this.connectionRef,
      reason: this.correctionReason,
    }).subscribe({
      next: () => {
        this.message.set(this.i18n.t('audit.quarantine.reopenOk', { row: row.sourceRecordNumber as number }));
        this.list(true);
      },
      error: (e) => {
        this.error.set(this.backendError(e, 'audit.quarantine.reopenError'));
        this.loading.set(false);
      },
    });
  }

  /** Paso 2: aprueba el run. El backend rechaza si el aprobador es el mismo solicitante. */
  approveRun(): void {
    if (!this.canAuditAdmin()) {
      return;
    }
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
    if (!this.canAuditOperate()) {
      return;
    }
    if (this.correctingRow() === row.id) {
      this.correctingRow.set(null);
      return;
    }
    this.correctionPayload = '';
    this.correctionReason = '';
    this.correctionTicketRef = '';
    this.correctionVersion.set(null);
    this.correctionPosition.set(null);
    this.correctionAdvanced.set(false);
    this.correctionEditableKeys.set([]);
    this.correctionEdits = {};
    this.correctionMetaEntries.set([]);
    this.correctionOriginal = {};
    this.correctingRow.set(row.id);
    const sourceFileHash = row.sourceFileHash?.trim();
    if (row.sourceRecordNumber === null || row.stagingId === null || !sourceFileHash) {
      return;
    }
    // Carga el payload actual + version: se edita sobre lo real y habilita el locking optimista.
    this.api.mt101StagingRow({
      fragmentSetId: this.fragmentSetId,
      sourceFileHash,
      recordNumber: row.sourceRecordNumber,
      stagingId: row.stagingId,
      connectionRef: this.connectionRef,
    }).subscribe({
      next: (view) => {
        if (this.correctingRow() === row.id) {
          this.correctionPayload = view.payloadJson ?? '';
          this.correctionVersion.set(view.version);
          this.correctionPosition.set(view);
          // Si el payload no parsea, cae a modo Avanzado (JSON crudo) como única vía.
          if (!this.parsePayloadIntoFields(view.payloadJson ?? '')) {
            this.correctionAdvanced.set(true);
          }
        }
      },
      error: () => {
        if (this.correctingRow() === row.id) {
          this.correctingRow.set(null);
          this.correctionPayload = '';
          this.correctionVersion.set(null);
          this.error.set(this.i18n.t('audit.quarantine.correctError'));
        }
      },
    });
  }

  /**
   * Parsea el payload JSON en campos editables (claves no-_) + metadata _ (read-only). Devuelve false si el JSON no
   * parsea (el caller cae a modo Avanzado). Guarda el objeto original para diff + coercion de tipos al guardar.
   */
  private parsePayloadIntoFields(json: string): boolean {
    let obj: Record<string, unknown>;
    try {
      obj = json.trim() ? JSON.parse(json) : {};
    } catch {
      this.correctionEditableKeys.set([]);
      this.correctionMetaEntries.set([]);
      this.correctionOriginal = {};
      return false;
    }
    this.correctionOriginal = obj;
    const editable: string[] = [];
    const edits: Record<string, string> = {};
    const meta: { key: string; value: string }[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const str = value === null || value === undefined ? '' : String(value);
      if (key.startsWith('_')) {
        meta.push({ key, value: str });
      } else {
        editable.push(key);
        edits[key] = str;
      }
    }
    this.correctionEditableKeys.set(editable);
    this.correctionEdits = edits;
    this.correctionMetaEntries.set(meta);
    return true;
  }

  /** Alterna entre el editor de campos y el JSON crudo, sincronizando ambas representaciones. */
  toggleCorrectionAdvanced(): void {
    if (!this.correctionAdvanced()) {
      // campos -> JSON: regenero el payload con los edits aplicados (para que el textarea los refleje).
      this.correctionPayload = JSON.stringify(this.buildEditedPayload(), null, 2);
      this.correctionAdvanced.set(true);
    } else if (this.parsePayloadIntoFields(this.correctionPayload)) {
      this.correctionAdvanced.set(false);
    } else {
      this.error.set(this.i18n.t('audit.quarantine.correctInvalidJson'));
    }
  }

  /** Payload original con los edits aplicados (para el textarea Avanzado). */
  private buildEditedPayload(): Record<string, unknown> {
    const out: Record<string, unknown> = { ...this.correctionOriginal };
    for (const key of this.correctionEditableKeys()) {
      out[key] = this.coerceToOriginalType(key, this.correctionEdits[key] ?? '');
    }
    return out;
  }

  /** Merge-patch de SOLO los campos cambiados (coercidos al tipo original). No incluye los _ ni lo no tocado. */
  private buildCorrectionPatch(): Record<string, unknown> {
    const patch: Record<string, unknown> = {};
    for (const key of this.correctionEditableKeys()) {
      const edited = this.correctionEdits[key] ?? '';
      const original = this.correctionOriginal[key];
      const originalStr = original === null || original === undefined ? '' : String(original);
      if (edited !== originalStr) {
        patch[key] = this.coerceToOriginalType(key, edited);
      }
    }
    return patch;
  }

  /** Coerce el valor de texto al tipo del valor original (money-safety: numero->number, boolean->boolean, resto texto). */
  private coerceToOriginalType(key: string, value: string): unknown {
    const original = this.correctionOriginal[key];
    if (typeof original === 'number') {
      const n = Number(value);
      return value.trim() !== '' && !Number.isNaN(n) ? n : value;
    }
    if (typeof original === 'boolean') {
      const lower = value.trim().toLowerCase();
      return lower === 'true' || lower === 'false' ? lower === 'true' : value;
    }
    return value;
  }

  saveCorrection(row: Mt101FailedRecord): void {
    if (!this.canAuditOperate()) {
      return;
    }
    const sourceFileHash = row.sourceFileHash?.trim();
    if (row.sourceRecordNumber === null || row.stagingId === null || !sourceFileHash) {
      return;
    }
    if (this.correctionVersion() === null) {
      this.error.set(this.i18n.t('audit.quarantine.correctError'));
      return;
    }
    // Modo campos -> merge-patch de solo-cambios (coercido); modo Avanzado -> el JSON crudo tal cual.
    let payload: string;
    if (this.correctionAdvanced()) {
      if (!this.correctionPayload.trim()) {
        return;
      }
      payload = this.correctionPayload;
    } else {
      const patch = this.buildCorrectionPatch();
      if (Object.keys(patch).length === 0) {
        this.error.set(this.i18n.t('audit.quarantine.correctNoChanges'));
        return;
      }
      payload = JSON.stringify(patch);
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.mt101CorrectStagingRow({
      fragmentSetId: this.fragmentSetId,
      sourceFileHash,
      recordNumber: row.sourceRecordNumber,
      stagingId: row.stagingId,
      payload,
      version: this.correctionVersion() as number,
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
    if (row.sourceRecordNumber === null || row.stagingId === null || !sourceFileHash) {
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
      stagingId: row.stagingId,
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

  /** ADR-020 (A): carga el resumen de la cuarentena por causa (rule_code) del set. */
  private loadCauseSummary(): void {
    if (!this.fragmentSetId.trim()) {
      this.causeSummary.set([]);
      return;
    }
    this.api.mt101SummaryByRule({
      fragmentSetId: this.fragmentSetId,
      connectionRef: this.connectionRef,
      status: this.statusFilter?.trim() || 'QUARANTINED',
    }).subscribe({
      next: (rows) => this.causeSummary.set(rows),
      error: () => this.causeSummary.set([]),
    });
  }

  /** ADR-020 (A): filtra la lista a una causa (chip del panel) y recarga. */
  filterByCause(ruleCode: string): void {
    this.ruleCodeFilter = this.ruleCodeFilter === ruleCode ? '' : ruleCode;
    this.list(true);
  }

  /** ADR-020 (C1): descarga la planilla de correccion de la vista actual (set + causa/estado filtrados). */
  exportCorrectionSheet(): void {
    if (!this.fragmentSetId.trim()) {
      return;
    }
    this.exportingSheet.set(true);
    this.api.mt101CorrectionSheet({
      fragmentSetId: this.fragmentSetId,
      connectionRef: this.connectionRef,
      ruleCode: this.ruleCodeFilter,
      status: this.statusFilter?.trim() || 'QUARANTINED',
    }).subscribe({
      next: (blob) => {
        const rule = this.ruleCodeFilter?.trim() ? '-' + this.ruleCodeFilter.trim() : '';
        this.downloadBlob(blob, `correccion-${this.fragmentSetId}${rule}.xlsx`);
        this.exportingSheet.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('audit.quarantine.exportError'));
        this.exportingSheet.set(false);
      },
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  /** ADR-020 (C2): sube la planilla editada y muestra el dry-run (sin aplicar nada). */
  onCorrectionFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // permite re-subir el mismo archivo
    if (!file || !this.fragmentSetId.trim()) {
      return;
    }
    this.previewingSheet.set(true);
    this.correctionPreview.set(null);
    this.applyResult.set(null);
    this.lastCorrectionFile = file;
    this.error.set(null);
    this.api.mt101PreviewCorrectionSheet({
      fragmentSetId: this.fragmentSetId,
      connectionRef: this.connectionRef,
      file,
    }).subscribe({
      next: (preview) => {
        this.correctionPreview.set(preview);
        this.previewingSheet.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || this.i18n.t('audit.quarantine.previewError'));
        this.previewingSheet.set(false);
      },
    });
  }

  /**
   * ADR-020 (C3): aplica la planilla ya revisada en el preview. Exige rol de operacion + motivo + confirmacion
   * explicita (mutacion masiva). Reenvia el MISMO archivo del preview (nada se reescribe entre revisar y aplicar).
   */
  applyCorrectionSheet(): void {
    const preview = this.correctionPreview();
    if (!this.canAuditOperate() || !preview || !this.lastCorrectionFile || preview.toCorrect <= 0) {
      return;
    }
    if (!this.bulkCorrectionReason.trim()) {
      this.error.set(this.i18n.t('audit.quarantine.applyReasonRequired'));
      return;
    }
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          message: this.i18n.t('audit.quarantine.applyConfirm', { count: preview.toCorrect }),
          confirmLabel: this.i18n.t('audit.quarantine.applySheet'),
        },
        autoFocus: false,
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.runApplyCorrectionSheet();
        }
      });
  }

  private runApplyCorrectionSheet(): void {
    if (!this.lastCorrectionFile) {
      return;
    }
    this.applyingSheet.set(true);
    this.applyResult.set(null);
    this.error.set(null);
    this.api.mt101ApplyCorrectionSheet({
      fragmentSetId: this.fragmentSetId,
      connectionRef: this.connectionRef,
      reason: this.bulkCorrectionReason,
      ticketRef: this.bulkCorrectionTicketRef,
      file: this.lastCorrectionFile,
    }).subscribe({
      next: (result) => {
        this.applyResult.set(result);
        this.correctionPreview.set(null);
        this.applyingSheet.set(false);
        // La cuarentena cambio: refresca la lista y el resumen por causa.
        this.list();
      },
      error: (err) => {
        this.error.set(err?.error?.message || this.i18n.t('audit.quarantine.applyError'));
        this.applyingSheet.set(false);
      },
    });
  }

  clearCorrectionPreview(): void {
    this.correctionPreview.set(null);
    this.lastCorrectionFile = null;
  }

  clearApplyResult(): void {
    this.applyResult.set(null);
  }

  /** v60: carga la lista detallada de conflictos de pago del set (on-demand desde la alerta). */
  loadPayConflicts(): void {
    if (!this.fragmentSetId.trim()) {
      return;
    }
    this.payConflictsShown.set(true);
    this.api.mt101PayConflicts({
      fragmentSetId: this.fragmentSetId,
      connectionRef: this.connectionRef,
    }).subscribe({
      next: (rows) => this.payConflicts.set(rows),
      error: () => {
        this.payConflicts.set([]);
        this.error.set(this.i18n.t('audit.quarantine.conflictsError'));
      },
    });
  }

  /**
   * v60 (gobernado): resuelve el UNCERTAIN normal del set consultando STATUS (nunca reenvía) y detecta conflictos
   * SENT→banco-REJECTED. Motivo obligatorio (reutiliza payResolutionReason). Recarga summary/lista/conflictos.
   */
  resolveNormalUncertainPay(): void {
    if (!this.canAuditOperate() || !this.fragmentSetId.trim()) {
      return;
    }
    if (!this.payResolutionReason.trim()) {
      this.error.set(this.i18n.t('audit.quarantine.payResolutionReasonRequired'));
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.api.mt101ResolveUncertainNormalPay({
      fragmentSetId: this.fragmentSetId,
      connectionRef: this.connectionRef,
      reason: this.payResolutionReason,
    }).subscribe({
      next: (result: Mt101NormalPayResolution) => {
        this.message.set(this.i18n.t('audit.quarantine.normalPayResolved', {
          sent: result.resolvedSent,
          rejected: result.resolvedRejected,
          pending: result.stillPending,
          conflicts: result.conflicts,
        }));
        this.loading.set(false);
        this.list(false);
        if (this.payConflictsShown()) {
          this.loadPayConflicts();
        }
      },
      error: (e) => {
        this.error.set(this.backendError(e, 'audit.quarantine.normalPayError'));
        this.loading.set(false);
      },
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
    this.loadCauseSummary();
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
        this.loadRebuildRuns();
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
    if (!this.canAuditOperate()) {
      return;
    }
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
    if (!this.canAuditOperate()) {
      return;
    }
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
        // B2': el correctivo queda BUILT; se ofrece avanzar su ciclo bancario (VALIDATE/ARCHIVE/PAY).
        this.correctiveRun.set({ rebuildRunId: result.rebuildRunId ?? result.correctiveSetId, correctiveSetId: result.correctiveSetId, status: 'BUILT' });
        this.list(true);
      },
      error: (e) => {
        this.error.set(this.backendError(e, 'audit.quarantine.rebuildError'));
        this.loading.set(false);
      },
    });
  }

  // B2': ciclo bancario del correctivo. VALIDATE/ARCHIVE automáticos; PAY con maker-checker propio.
  readonly correctiveRun = signal<Mt101CorrectiveLifecycle | null>(null);
  // v24: historial append-only de acciones PAY visible para el operador (trazabilidad E2E).
  readonly payActions = signal<Mt101PayAction[]>([]);

  /** v24: carga el historial completo de acciones PAY del run correctivo actual. */
  loadPayActions(): void {
    const run = this.correctiveRun();
    if (!run) {
      return;
    }
    this.api.mt101PayActions({ rebuildRunId: run.rebuildRunId, connectionRef: this.connectionRef }).subscribe({
      next: (actions) => this.payActions.set(actions),
      error: (e) => this.error.set(this.backendError(e, 'audit.quarantine.correctiveError')),
    });
  }

  dismissCorrective(): void {
    this.correctiveRun.set(null);
    this.payActions.set([]);
  }

  payStatusFor(rebuildRunId: string): string {
    return this.rebuildRuns().find((run) => run.rebuildRunId === rebuildRunId)?.payStatus || 'NOT_REQUESTED';
  }

  /** B2': avanza el correctivo BUILT -> VALIDATED -> ARCHIVED (no envía). */
  advanceCorrective(): void {
    if (!this.canAuditOperate()) {
      return;
    }
    const run = this.correctiveRun();
    if (!run) {
      return;
    }
    this.runCorrectiveAction(this.api.mt101AdvanceCorrective({ rebuildRunId: run.rebuildRunId, connectionRef: this.connectionRef }));
  }

  /** B2': el maker solicita el envío del correctivo (ya ARCHIVED). Motivo + ticket obligatorios. */
  requestCorrectivePay(): void {
    if (!this.canAuditOperate()) {
      return;
    }
    const run = this.correctiveRun();
    if (!run) {
      return;
    }
    if (!this.payRequestReason.trim() || !this.payRequestTicket.trim()) {
      this.error.set(this.i18n.t('audit.quarantine.payReasonRequired'));
      return;
    }
    this.runCorrectiveAction(this.api.mt101RequestCorrectivePay({
      rebuildRunId: run.rebuildRunId,
      connectionRef: this.connectionRef,
      reason: this.payRequestReason,
      ticketRef: this.payRequestTicket,
    }));
  }

  /** B2': resuelve un PAY_UNCERTAIN consultando STATUS (no reenvía). Motivo de negocio obligatorio. */
  resolveUncertainPay(): void {
    if (!this.canAuditOperate()) {
      return;
    }
    const run = this.correctiveRun();
    if (!run) {
      return;
    }
    if (!this.payResolutionReason.trim()) {
      this.error.set(this.i18n.t('audit.quarantine.payResolutionReasonRequired'));
      return;
    }
    this.runCorrectiveAction(this.api.mt101ResolveUncertainPay({
      rebuildRunId: run.rebuildRunId,
      connectionRef: this.connectionRef,
      reason: this.payResolutionReason,
    }));
  }

  /** B2': el checker (distinto del maker) aprueba y ejecuta el envío (PAY real). */
  approveCorrectivePay(): void {
    if (!this.canAuditAdmin()) {
      return;
    }
    const run = this.correctiveRun();
    if (!run) {
      return;
    }
    this.runCorrectiveAction(this.api.mt101ApproveCorrectivePay({ rebuildRunId: run.rebuildRunId, connectionRef: this.connectionRef }));
  }

  private runCorrectiveAction(action: Observable<Mt101CorrectiveLifecycle>): void {
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    action.subscribe({
      next: (result) => {
        this.correctiveRun.set(result);
        this.message.set(this.i18n.t('audit.quarantine.correctiveStatus', { status: result.status }));
        this.loading.set(false);
        this.loadRebuildRuns();
        this.list(false);
      },
      error: (e) => {
        this.error.set(this.backendError(e, 'audit.quarantine.correctiveError'));
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

  private loadRebuildRuns(): void {
    if (!this.fragmentSetId.trim()) {
      return;
    }
    this.api.mt101RebuildRuns({
      fragmentSetId: this.fragmentSetId,
      connectionRef: this.connectionRef,
      limit: 10,
    }).subscribe({
      next: (runs) => {
        this.rebuildRuns.set(runs);
        const governed = runs.find((run) => ['REQUESTED', 'APPROVED'].includes(run.status));
        if (governed) {
          this.rebuildRun.set(governed);
          return;
        }
        const corrective = runs.find((run) =>
          ['BUILT', 'VALIDATED', 'ARCHIVED', 'SENT', 'PARTIALLY_SENT', 'PARTIALLY_FAILED', 'CONFIRMED'].includes(run.status));
        if (corrective) {
          this.correctiveRun.set({
            rebuildRunId: corrective.rebuildRunId,
            correctiveSetId: corrective.correctiveSetId,
            status: corrective.status,
          });
        }
      },
      error: () => this.rebuildRuns.set([]),
    });
  }
}
