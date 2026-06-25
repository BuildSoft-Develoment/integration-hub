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

  readonly rows = signal<Mt101FragmentLink[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

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
