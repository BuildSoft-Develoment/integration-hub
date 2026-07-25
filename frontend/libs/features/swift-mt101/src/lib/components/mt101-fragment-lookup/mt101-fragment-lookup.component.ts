// @trace SWIFT-MT101: lookup de fragmentos generados por fila origen
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BreadcrumbService, I18nService } from '@integration-hub/core/services';
import { IconComponent, RelativeTimePipe } from '@integration-hub/shared/ui';
import { Mt101AuditApiService } from '../../api/mt101-audit-api.service';
import { Mt101FragmentLink, Mt101PhysicalLineLineage } from '../../models/mt101.models';
import {
  AuditWorkspaceNavComponent,
  RecordLineageApiService,
  RecordLineageEntry,
  timelineStatusIcon,
  timelineStatusKind,
} from '@integration-hub/shared/audit-kit';

@Component({
  selector: 'ih-mt101-fragment-lookup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    AuditWorkspaceNavComponent,
    RelativeTimePipe,
    IconComponent,
  ],
  styleUrl: './mt101-fragment-lookup.component.css',
  templateUrl: './mt101-fragment-lookup.component.html',
})
export class Mt101FragmentLookupComponent {
  private readonly api = inject(Mt101AuditApiService);
  private readonly lineageApi = inject(RecordLineageApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly i18n = inject(I18nService);

  recordNumber = '';
  sourceFileHash = '';
  sourceTable = '';
  processExecutionId = '';
  fragmentSetId = '';
  connectionRef = '';
  // item 2 (búsqueda inversa): "archivo + línea física" → registro lógico (auto-llena recordNumber para el lookup).
  physicalLine = '';
  // #4 (Excel): "archivo + hoja + fila Excel" → registro (la línea física no aplica a Excel).
  sheetName = '';
  sheetRow = '';

  readonly rows = signal<Mt101FragmentLink[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly physicalLineMsg = signal<string | null>(null);
  // G-A: TODOS los registros de esa línea física (uno por ejecución: reprocesos visibles), con su cuarentena.
  readonly physicalLineMatches = signal<Mt101PhysicalLineLineage[]>([]);

  // B (página única): lineage E2E embebido en la misma pantalla (sin navegar). Reusa /api/query/record-lineage
  // (modo sourceRow) y el mismo render de timeline del record-lineage. El deep-link a la vista completa se conserva.
  readonly lineageEntries = signal<RecordLineageEntry[]>([]);
  readonly lineageLoading = signal(false);
  readonly lineageError = signal<string | null>(null);
  readonly lineageForRef = signal<string | null>(null);
  protected readonly statusKind = timelineStatusKind;
  protected readonly statusIcon = timelineStatusIcon;

  /** B: resuelve y muestra el timeline E2E de un match AQUÍ mismo (staging→fragmento→…→STATUS→RECONCILE→conflictos). */
  showLineage(match: Mt101PhysicalLineLineage): void {
    this.lineageForRef.set(`${match.sourceFileHash} · #${match.recordIndex + 1}`);
    this.lineageEntries.set([]);
    this.lineageError.set(null);
    this.lineageLoading.set(true);
    this.lineageApi.recordLineage({
      sourceFileHash: match.sourceFileHash,
      recordNumber: match.recordIndex + 1,
      processExecutionId: match.processExecutionId ?? undefined,
    }).subscribe({
      next: (entries) => {
        this.lineageEntries.set(entries);
        this.lineageLoading.set(false);
      },
      error: () => {
        this.lineageError.set(this.i18n.t('audit.lookup.lineageError'));
        this.lineageLoading.set(false);
      },
    });
  }

  closeLineage(): void {
    this.lineageForRef.set(null);
    this.lineageEntries.set([]);
    this.lineageError.set(null);
  }

  /**
   * G-A: resuelve una LÍNEA FÍSICA del archivo a la LISTA de registros (staging_id + record_index por ejecución), cada
   * uno con su cuarentena si falló validación. Auto-llena recordNumber con el primero (más reciente) para seguir al
   * lookup de fragmentos; si hay varios (reproceso), la tabla los muestra y el operador elige.
   */
  resolvePhysicalLine(): void {
    this.physicalLineMsg.set(null);
    this.physicalLineMatches.set([]);
    const line = Number(this.physicalLine);
    if (!this.sourceFileHash.trim() || !Number.isInteger(line) || line < 1) {
      this.physicalLineMsg.set(this.i18n.t('audit.lookup.physicalLineInvalid'));
      return;
    }
    this.api.mt101ByPhysicalLine({
      sourceFileHash: this.sourceFileHash,
      physicalLine: line,
      processExecutionId: this.processExecutionId ? Number(this.processExecutionId) : undefined,
      connectionRef: this.connectionRef,
    }).subscribe({
      next: (matches) => {
        if (!matches || matches.length === 0) {
          this.physicalLineMsg.set(this.i18n.t('audit.lookup.physicalLineEmpty', { line }));
          return;
        }
        this.physicalLineMatches.set(matches);
        // Auto-llena con el primero (más reciente); si hay varios el operador puede elegir en la tabla.
        this.pickPhysicalLineMatch(matches[0]);
        if (matches.length > 1) {
          this.physicalLineMsg.set(this.i18n.t('audit.lookup.physicalLineMultiple', { line, count: matches.length }));
        }
      },
      error: () => this.physicalLineMsg.set(this.i18n.t('audit.lookup.physicalLineError')),
    });
  }

  /**
   * #4 (Excel): resuelve "archivo + hoja + fila Excel" a la LISTA de registros (con cuarentena). Reusa la misma tabla
   * de matches y el auto-llenado de recordNumber que la búsqueda por línea física; para Excel la clave es hoja+fila.
   */
  resolveSheetRow(): void {
    this.physicalLineMsg.set(null);
    this.physicalLineMatches.set([]);
    const row = Number(this.sheetRow);
    if (!this.sourceFileHash.trim() || !this.sheetName.trim() || !Number.isInteger(row) || row < 1) {
      this.physicalLineMsg.set(this.i18n.t('audit.lookup.sheetRowInvalid'));
      return;
    }
    this.api.mt101BySheetRow({
      sourceFileHash: this.sourceFileHash,
      sheetName: this.sheetName,
      sheetRow: row,
      processExecutionId: this.processExecutionId ? Number(this.processExecutionId) : undefined,
      connectionRef: this.connectionRef,
    }).subscribe({
      next: (matches) => {
        if (!matches || matches.length === 0) {
          this.physicalLineMsg.set(this.i18n.t('audit.lookup.sheetRowEmpty', { sheet: this.sheetName, row }));
          return;
        }
        this.physicalLineMatches.set(matches);
        this.pickPhysicalLineMatch(matches[0]);
        if (matches.length > 1) {
          this.physicalLineMsg.set(this.i18n.t('audit.lookup.physicalLineMultiple', { line: row, count: matches.length }));
        }
      },
      error: () => this.physicalLineMsg.set(this.i18n.t('audit.lookup.sheetRowError')),
    });
  }

  /** Selecciona un match de la línea física: auto-llena recordNumber (1-based = record_index + 1) para el lookup. */
  pickPhysicalLineMatch(match: Mt101PhysicalLineLineage): void {
    this.recordNumber = String(match.recordIndex + 1);
    if (match.processExecutionId != null) {
      this.processExecutionId = String(match.processExecutionId);
    }
    this.physicalLineMsg.set(this.i18n.t('audit.lookup.physicalLineResolved', {
      line: match.physicalLine ?? this.physicalLine, record: match.recordIndex + 1, staging: match.stagingId,
    }));
  }

  constructor() {
    this.breadcrumb.setItems([
      { label: this.i18n.t('audit.breadcrumb.root'), link: ['/audit'] },
      { label: this.i18n.t('audit.breadcrumb.fragments') },
    ]);
    this.breadcrumb.setBackLabel(this.i18n.t('audit.common.back'));
    // Drill-in desde el lineage (?recordNumber=) u otra vista -> auto-busca.
    const qp = this.route.snapshot.queryParamMap;
    const recordNumber = qp.get('recordNumber');
    this.sourceFileHash = qp.get('sourceFileHash') ?? '';
    this.fragmentSetId = qp.get('fragmentSetId') ?? '';
    this.sourceTable = qp.get('sourceTable') ?? '';
    this.processExecutionId = qp.get('processExecutionId') ?? '';
    if (recordNumber && this.sourceFileHash) {
      this.recordNumber = recordNumber;
      this.search();
    }
  }

  search(): void {
    if (!String(this.recordNumber).trim() || !this.sourceFileHash.trim()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.mt101FragmentLinks({
      recordNumber: this.recordNumber,
      sourceFileHash: this.sourceFileHash,
      sourceTable: this.sourceTable,
      processExecutionId: this.processExecutionId,
      fragmentSetId: this.fragmentSetId,
      connectionRef: this.connectionRef,
    }).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('audit.lookup.error'));
        this.loading.set(false);
      },
    });
  }

  clear(): void {
    this.recordNumber = '';
    this.sourceFileHash = '';
    this.sourceTable = '';
    this.processExecutionId = '';
    this.fragmentSetId = '';
    this.connectionRef = '';
    this.rows.set([]);
    this.error.set(null);
  }
}
