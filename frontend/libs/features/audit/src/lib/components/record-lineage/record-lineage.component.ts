// @trace observabilidad: visor de trazabilidad E2E a nivel de registro
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BreadcrumbService, I18nService } from '@integration-hub/core/services';
import { IconComponent, RelativeTimePipe } from '@integration-hub/shared/ui';
import {
  AuditWorkspaceNavComponent,
  RecordLineageApiService,
  RecordLineageEntry,
  durationBetween,
  timelineStatusIcon,
  timelineStatusKind,
} from '@integration-hub/shared/audit-kit';

type SearchMode = 'record' | 'trace' | 'key' | 'sourceRow';

/**
 * Visor de la linea de tiempo E2E de un registro (:20:) o de toda una ejecucion
 * (traceId): INGESTED -> BUILT -> VALIDATED -> ARCHIVED -> SENT/REJECTED.
 * Consume GET /api/query/record-lineage.
 */
@Component({
  selector: 'ih-record-lineage',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    RelativeTimePipe,
    IconComponent,
    AuditWorkspaceNavComponent,
  ],
  styleUrl: './record-lineage.component.css',
  templateUrl: './record-lineage.component.html',
})
export class RecordLineageComponent {
  private readonly api = inject(RecordLineageApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly i18n = inject(I18nService);

  protected readonly statusKind = timelineStatusKind;
  protected readonly statusIcon = timelineStatusIcon;

  recordId = '';
  traceId = '';
  key = 'paymentReference';
  value = '';
  sourceFileHash = '';
  recordNumber = '';
  // B: acota la traza a una ejecución (desambigua reprocesos del mismo archivo+fila).
  processExecutionId = '';

  readonly mode = signal<SearchMode>('record');
  readonly modes: { value: SearchMode; labelKey: string }[] = [
    { value: 'record', labelKey: 'audit.lineage.modeRecord' },
    { value: 'trace', labelKey: 'audit.lineage.modeTrace' },
    { value: 'key', labelKey: 'audit.lineage.modeKey' },
    { value: 'sourceRow', labelKey: 'audit.lineage.modeSourceRow' },
  ];

  constructor() {
    this.breadcrumb.setItems([
      { label: this.i18n.t('audit.breadcrumb.root'), link: ['/audit'] },
      { label: this.i18n.t('audit.breadcrumb.lineage') },
    ]);
    this.breadcrumb.setBackLabel(this.i18n.t('audit.common.back'));
    // Drill-in desde cuarentena / ejecuciones: pre-rellena, fija el modo y auto-busca.
    const qp = this.route.snapshot.queryParamMap;
    const recordId = qp.get('recordId');
    const traceId = qp.get('traceId');
    const hash = qp.get('sourceFileHash');
    const recordNumber = qp.get('recordNumber');
    const key = qp.get('key');
    const value = qp.get('value');
    if (recordId) {
      this.recordId = recordId;
      this.mode.set('record');
      this.searchByRecord();
    } else if (traceId) {
      this.traceId = traceId;
      this.mode.set('trace');
      this.searchByTrace();
    } else if (hash && recordNumber) {
      this.sourceFileHash = hash;
      this.recordNumber = recordNumber;
      this.processExecutionId = qp.get('processExecutionId') ?? '';
      this.mode.set('sourceRow');
      this.searchBySourceRow();
    } else if (key && value) {
      this.key = key;
      this.value = value;
      // Un deep-link por :20: puede acotar a su ejecucion (evita mezclar reprocesos del mismo :20:).
      this.processExecutionId = qp.get('processExecutionId') ?? '';
      this.mode.set('key');
      this.searchByKey();
    }
  }

  readonly keyOptions = [
    { value: 'paymentReference', label: ':20:' },
    { value: 'transactionReference', label: ':21:' },
    { value: 'uetr', label: 'UETR' },
    { value: 'archiveId', label: 'Archive ID' },
    { value: 'gatewayReference', label: 'Gateway' },
    { value: 'businessKeyHash', label: 'Hash negocio' },
  ];

  readonly entries = signal<RecordLineageEntry[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Tope de la UI: una traza por registro trae pocas filas; por ejecucion (lote
  // grande) el cold store puede tener decenas de miles -> se trunca y se avisa.
  private readonly limit = 500;
  readonly truncated = computed(() => this.entries().length >= this.limit);

  setMode(mode: SearchMode): void {
    this.mode.set(mode);
  }

  /** Pivota la traza: un clic en una clave del timeline relanza la busqueda por ella. */
  pivotKey(key: string, value: string | number): void {
    this.mode.set('key');
    this.key = key;
    this.value = String(value);
    this.searchByKey();
  }

  pivotRecord(recordId: string): void {
    this.mode.set('record');
    this.recordId = recordId;
    this.searchByRecord();
  }

  pivotSourceRow(sourceFileHash: string, recordNumber: number, processExecutionId: number | null): void {
    this.mode.set('sourceRow');
    this.sourceFileHash = sourceFileHash;
    this.recordNumber = String(recordNumber);
    // Acota a la ejecucion del hito (evita mezclar reprocesos del mismo archivo+fila); '' = todas.
    this.processExecutionId = processExecutionId != null ? String(processExecutionId) : '';
    this.searchBySourceRow();
  }

  /** Hay datos suficientes para el modo activo. */
  canSearch(): boolean {
    switch (this.mode()) {
      case 'record':
        return !!this.recordId.trim();
      case 'trace':
        return !!this.traceId.trim();
      case 'key':
        return !!this.key.trim() && !!this.value.trim();
      case 'sourceRow':
        return !!this.sourceFileHash.trim() && !!this.recordNumber.trim();
      default:
        return false;
    }
  }

  /** Un único botón despacha según el modo seleccionado. */
  search(): void {
    switch (this.mode()) {
      case 'record':
        this.searchByRecord();
        break;
      case 'trace':
        this.searchByTrace();
        break;
      case 'key':
        this.searchByKey();
        break;
      case 'sourceRow':
        this.searchBySourceRow();
        break;
    }
  }

  /** Duración entre el hito i-1 y el i (null en el primero). */
  durationAt(index: number): string | null {
    if (index <= 0) {
      return null;
    }
    const list = this.entries();
    return durationBetween(list[index - 1]?.eventTs, list[index]?.eventTs);
  }

  searchByRecord(): void {
    if (!this.recordId.trim()) {
      return;
    }
    this.fetch({ recordId: this.recordId });
  }

  searchByTrace(): void {
    if (!this.traceId.trim()) {
      return;
    }
    this.fetch({ traceId: this.traceId });
  }

  searchByKey(): void {
    if (!this.key.trim() || !this.value.trim()) {
      return;
    }
    this.fetch({ key: this.key, value: this.value });
  }

  searchBySourceRow(): void {
    if (!this.sourceFileHash.trim() || !this.recordNumber.trim()) {
      return;
    }
    this.fetch({
      sourceFileHash: this.sourceFileHash,
      recordNumber: this.recordNumber,
      processExecutionId: this.processExecutionId.trim() || undefined,
    });
  }

  private fetch(query: { recordId?: string; traceId?: string; key?: string; value?: string; sourceFileHash?: string; recordNumber?: string; processExecutionId?: string }): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.recordLineage({ ...query, limit: this.limit }).subscribe({
      next: (rows) => {
        this.entries.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('audit.lineage.error'));
        this.loading.set(false);
      },
    });
  }
}
