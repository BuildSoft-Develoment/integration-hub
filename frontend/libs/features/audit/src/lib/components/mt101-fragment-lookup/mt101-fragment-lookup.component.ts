// @trace SWIFT-MT101: lookup de fragmentos generados por fila origen
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BreadcrumbService, I18nService } from '@integration-hub/core/services';
import { RelativeTimePipe } from '@integration-hub/shared/ui';
import { AuditApiService } from '../../api/audit-api.service';
import { Mt101FragmentLink } from '../../models/audit.models';
import { AuditWorkspaceNavComponent } from '../audit-workspace-nav/audit-workspace-nav.component';

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
  ],
  styleUrl: './mt101-fragment-lookup.component.css',
  templateUrl: './mt101-fragment-lookup.component.html',
})
export class Mt101FragmentLookupComponent {
  private readonly api = inject(AuditApiService);
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

  readonly rows = signal<Mt101FragmentLink[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly physicalLineMsg = signal<string | null>(null);

  /**
   * item 2: resuelve una LÍNEA FÍSICA del archivo a su registro lógico (staging_id + record_index) y auto-llena
   * recordNumber para que el operador siga al lookup de fragmentos. 204 → sin registro en esa línea.
   */
  resolvePhysicalLine(): void {
    this.physicalLineMsg.set(null);
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
      next: (match) => {
        if (!match) {
          this.physicalLineMsg.set(this.i18n.t('audit.lookup.physicalLineEmpty', { line }));
          return;
        }
        // Registro lógico 1-based visible al operador = record_index (0-based) + 1.
        this.recordNumber = String(match.recordIndex + 1);
        this.physicalLineMsg.set(this.i18n.t('audit.lookup.physicalLineResolved', {
          line, record: match.recordIndex + 1, staging: match.stagingId,
        }));
      },
      error: () => this.physicalLineMsg.set(this.i18n.t('audit.lookup.physicalLineError')),
    });
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
