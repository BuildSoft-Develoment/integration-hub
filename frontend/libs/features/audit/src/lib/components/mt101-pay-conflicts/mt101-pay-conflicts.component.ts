import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { BreadcrumbService, I18nService } from '@integration-hub/core/services';
import { IconComponent, RelativeTimePipe } from '@integration-hub/shared/ui';
import { AuditApiService } from '../../api/audit-api.service';
import { Mt101OpenPayConflict, Mt101OpenPayConflictConfirmation } from '../../models/audit.models';
import { AuditWorkspaceNavComponent } from '../audit-workspace-nav/audit-workspace-nav.component';

/**
 * Consola de PAY Conflicts (inbox transversal): landing operativa de los conflictos de pago ABIERTOS de todos los
 * sets/ejecuciones (contradicción terminal worker↔STATUS), sin exigir conocer el fragmentSetId de antemano. Cada fila
 * enlaza a la vista por-set (quarantine, donde se concilia) y al lineage E2E. Solo lectura: complementa la superficie
 * por-set existente con la que faltaba (el punto de entrada global).
 */
@Component({
  selector: 'ih-mt101-pay-conflicts',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTooltipModule,
    RouterLink,
    AuditWorkspaceNavComponent,
    RelativeTimePipe,
    IconComponent,
  ],
  styleUrl: './mt101-pay-conflicts.component.css',
  templateUrl: './mt101-pay-conflicts.component.html',
})
export class Mt101PayConflictsComponent {
  private readonly api = inject(AuditApiService);
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly i18n = inject(I18nService);

  readonly conflicts = signal<Mt101OpenPayConflict[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // A1: evidencia inline (confirmaciones del banco) del conflicto expandido.
  readonly expandedKey = signal<string | null>(null);
  readonly confirmations = signal<Mt101OpenPayConflictConfirmation[]>([]);
  readonly confirmationsLoading = signal(false);
  readonly confirmationsError = signal<string | null>(null);

  constructor() {
    this.breadcrumb.setItems([
      { label: this.i18n.t('audit.breadcrumb.root'), link: ['/audit'] },
      { label: this.i18n.t('audit.breadcrumb.payConflicts') },
    ]);
    this.breadcrumb.setBackLabel(this.i18n.t('audit.common.back'));
    this.load();
  }

  /** Primera página: reinicia la lista y el cursor. */
  load(): void {
    this.fetch(null);
  }

  /** Siguiente página keyset: apila los items nuevos (sin recargar los ya mostrados). */
  loadMore(): void {
    const cursor = this.nextCursor();
    if (cursor && !this.loading()) {
      this.fetch(cursor);
    }
  }

  private fetch(cursor: string | null): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.mt101OpenPayConflicts(cursor ? { cursor } : {}).subscribe({
      next: (page) => {
        this.conflicts.set(cursor ? [...this.conflicts(), ...page.items] : page.items);
        this.nextCursor.set(page.nextCursor);
        this.loading.set(false);
      },
      error: () => {
        if (!cursor) {
          this.conflicts.set([]);
        }
        this.nextCursor.set(null);
        this.error.set(this.i18n.t('audit.payConflicts.error'));
        this.loading.set(false);
      },
    });
  }

  /** Track-by estable: el id colisiona entre ledgers → se combina con el source. */
  trackConflict(_: number, c: Mt101OpenPayConflict): string {
    return c.source + '-' + c.id;
  }

  /**
   * A1: muestra/oculta la evidencia inline (confirmaciones del banco) de un conflicto — gatewayReference + último
   * STATUS, la razón real por la que quedó en conflicto. Toggle: si ya está expandido, lo cierra.
   */
  toggleEvidence(c: Mt101OpenPayConflict): void {
    const key = this.trackConflict(0, c);
    if (this.expandedKey() === key) {
      this.expandedKey.set(null);
      return;
    }
    this.expandedKey.set(key);
    this.confirmations.set([]);
    this.confirmationsError.set(null);
    this.confirmationsLoading.set(true);
    this.api.mt101PayConflictConfirmations({ sendersReference: c.sendersReference }).subscribe({
      next: (rows) => {
        this.confirmations.set(rows);
        this.confirmationsLoading.set(false);
      },
      error: () => {
        this.confirmationsError.set(this.i18n.t('audit.payConflicts.evidenceError'));
        this.confirmationsLoading.set(false);
      },
    });
  }

  /** A1: exporta la lista visible de conflictos como JSON (snapshot de evidencia para auditoría). */
  exportEvidence(): void {
    const rows = this.conflicts();
    if (rows.length === 0) {
      return;
    }
    const json = JSON.stringify(rows, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pay-conflicts-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
