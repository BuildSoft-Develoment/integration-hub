// @trace SWIFT-MT101 D1: visibilidad del ledger de dispatch del PAY directo por lista (mt101_pay_dispatch_intent)
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { AuthAccessService, BreadcrumbService, I18nService } from '@integration-hub/core/services';
import { RelativeTimePipe } from '@integration-hub/shared/ui';
import { Mt101AuditApiService } from '../../api/mt101-audit-api.service';
import { Mt101PayDispatchIntent, Mt101PayDispatchSummary } from '../../models/mt101.models';
import { AuditWorkspaceNavComponent } from '@integration-hub/shared/audit-kit';

/**
 * D1 (visibilidad): superficie de lectura del PAY directo por lista. Un dispatch que queda UNCERTAIN (o DISPATCHING
 * colgado por un crash) bloquea el reenvío del pago "hasta conciliar" y antes era invisible. Aquí el operador ve el
 * resumen del ledger + la lista de intenciones atascadas con su motivo. Solo lectura (espejo de item 3 para el camino
 * de lista); la resolución automática (D2) queda pendiente.
 */
@Component({
  selector: 'ih-mt101-pay-dispatch',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    RouterLink,
    AuditWorkspaceNavComponent,
    RelativeTimePipe,
  ],
  styleUrl: './mt101-pay-dispatch.component.css',
  templateUrl: './mt101-pay-dispatch.component.html',
})
export class Mt101PayDispatchComponent {
  private readonly api = inject(Mt101AuditApiService);
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly access = inject(AuthAccessService);
  readonly i18n = inject(I18nService);
  readonly canAuditOperate = this.access.canAuditOperate;

  readonly summary = signal<Mt101PayDispatchSummary | null>(null);
  readonly stuck = signal<Mt101PayDispatchIntent[]>([]);

  /**
   * Cuantas intenciones atascadas NO se estan mostrando, o 0 si se ven todas.
   *
   * El endpoint `/stuck` acota a 100 por defecto (Mt101PayDispatchIntentLookupService.DEFAULT_LIMIT)
   * y el frontend no envia `limit`. La tarjeta de resumen y la alerta muestran el total REAL, asi que
   * con 250 atascados la pantalla decia 250 y la tabla listaba 100 sin avisar de los 150 que faltaban.
   * Un operador que trabaja "la lista" hasta acabarla se iba dejando pagos atascados creyendo que no
   * quedaba ninguno. Truncar en silencio es peor que no listar: da por revisado lo que no se vio.
   */
  readonly truncated = computed(() => {
    const total = this.summary()?.stuck ?? 0;
    const mostrados = this.stuck().length;
    return total > mostrados ? total - mostrados : 0;
  });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  // D2: reconcile gobernado. Motivo obligatorio (evidencia); una clave en vuelo a la vez.
  reason = '';
  readonly reconciling = signal<string | null>(null);
  // #2 (UX): la fila con el panel de motivo abierto (una a la vez), pegado a su accion. Separado de
  // reconciling (= la clave con la peticion en vuelo).
  readonly activeKey = signal<string | null>(null);

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

  /** #2: abre el panel inline de motivo para la fila (una a la vez), pegado a su boton. */
  startReconcile(row: Mt101PayDispatchIntent): void {
    if (!this.canAuditOperate()) {
      return;
    }
    this.activeKey.set(row.dispatchKey);
    this.reason = '';
    this.error.set(null);
    this.message.set(null);
  }

  cancelReconcile(): void {
    this.activeKey.set(null);
    this.reason = '';
  }

  /**
   * D2 (gobernado): reconcilia una intención atascada desde el terminal del archive que STATUS ya dejó. Motivo
   * obligatorio. Traduce el outcome del backend a un mensaje y recarga (si algo cambió).
   */
  reconcile(row: Mt101PayDispatchIntent): void {
    if (!this.canAuditOperate() || !this.reason.trim() || this.reconciling()) {
      return;
    }
    this.reconciling.set(row.dispatchKey);
    this.error.set(null);
    this.message.set(null);
    this.api.mt101PayDispatchReconcile(row.dispatchKey, this.reason.trim()).subscribe({
      next: (result) => {
        this.reconciling.set(null);
        const ref = row.sendersReference ?? row.dispatchKey;
        if (result.outcome === 'RECONCILED') {
          this.message.set(this.i18n.t('audit.payDispatch.reconcileOk', { ref, status: result.newStatus ?? '' }));
          this.reason = '';
          this.activeKey.set(null);
          this.load();
        } else {
          // NOT_STUCK / NO_EXECUTION / NO_TERMINAL: sin cambio, se explica por qué queda manual.
          this.message.set(this.i18n.t('audit.payDispatch.reconcileNoop.' + result.outcome, { ref }));
        }
      },
      error: () => {
        this.reconciling.set(null);
        this.error.set(this.i18n.t('audit.payDispatch.reconcileError'));
      },
    });
  }
}
