import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { BreadcrumbService, I18nService } from '@integration-hub/core/services';
import { RelativeTimePipe } from '@integration-hub/shared/ui';
import { AuditApiService } from '../../api/audit-api.service';
import { Mt101OpenPayConflict } from '../../models/audit.models';
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
    RouterLink,
    AuditWorkspaceNavComponent,
    RelativeTimePipe,
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
}
