// @trace SWIFT-MT101 D1: visibilidad del ledger de dispatch del PAY directo por lista (mt101_pay_dispatch_intent)
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { BreadcrumbService, I18nService } from '@integration-hub/core/services';
import { RelativeTimePipe } from '@integration-hub/shared/ui';
import { AuditApiService } from '../../api/audit-api.service';
import { Mt101PayDispatchIntent, Mt101PayDispatchSummary } from '../../models/audit.models';
import { AuditWorkspaceNavComponent } from '../audit-workspace-nav/audit-workspace-nav.component';

/**
 * D1 (visibilidad): superficie de lectura del PAY directo por lista. Un dispatch que queda UNCERTAIN (o DISPATCHING
 * colgado por un crash) bloquea el reenvío del pago "hasta conciliar" y antes era invisible. Aquí el operador ve el
 * resumen del ledger + la lista de intenciones atascadas con su motivo. Solo lectura (espejo de item 3 para el camino
 * de lista); la resolución automática (D2) queda pendiente.
 */
@Component({
  selector: 'ih-mt101-pay-dispatch',
  standalone: true,
  imports: [CommonModule, MatButtonModule, AuditWorkspaceNavComponent, RelativeTimePipe],
  styleUrl: './mt101-pay-dispatch.component.css',
  templateUrl: './mt101-pay-dispatch.component.html',
})
export class Mt101PayDispatchComponent {
  private readonly api = inject(AuditApiService);
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly i18n = inject(I18nService);

  readonly summary = signal<Mt101PayDispatchSummary | null>(null);
  readonly stuck = signal<Mt101PayDispatchIntent[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Conteo por estado como pares ordenados, para el desglose del resumen. */
  readonly statusEntries = computed(() => {
    const s = this.summary();
    return s ? Object.entries(s.byStatus).map(([status, count]) => ({ status, count })) : [];
  });

  constructor() {
    this.breadcrumb.setItems([
      { label: this.i18n.t('audit.breadcrumb.root'), link: ['/audit'] },
      { label: this.i18n.t('audit.breadcrumb.payDispatch') },
    ]);
    this.breadcrumb.setBackLabel(this.i18n.t('audit.common.back'));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.mt101PayDispatchSummary().subscribe({
      next: (s) => this.summary.set(s),
      error: () => {
        this.summary.set(null);
        this.error.set(this.i18n.t('audit.payDispatch.error'));
      },
    });
    this.api.mt101PayDispatchStuck().subscribe({
      next: (rows) => {
        this.stuck.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.stuck.set([]);
        this.error.set(this.i18n.t('audit.payDispatch.error'));
        this.loading.set(false);
      },
    });
  }
}
