import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { PageEvent } from '@angular/material/paginator';
import { AuditEditorComponent } from '../components/audit-editor/audit-editor.component';
import { AuditListComponent } from '../components/audit-list/audit-list.component';
import { AuditToolbarComponent } from '../components/audit-toolbar/audit-toolbar.component';
import { AuditWorkspaceNavComponent } from '@integration-hub/shared/audit-kit';
import { AppFeedbackService, downloadText, I18nService } from '@integration-hub/core/services';
import { AuditStore } from './audit.store';
import { AuditRecord } from '../models/audit.models';
import { eventsToCsv, eventsToJson } from '../utils/download-utils';

@Component({
  selector: 'ih-audit-page',
  standalone: true,
  providers: [AuditStore],
  imports: [CommonModule, MatProgressBarModule, MatSidenavModule, AuditWorkspaceNavComponent, AuditToolbarComponent, AuditListComponent, AuditEditorComponent],
  templateUrl: './audit-page.html',
  styleUrl: './audit-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditPageComponent implements OnInit {
  readonly store = inject(AuditStore);
  private readonly i18n = inject(I18nService);
  private readonly feedback = inject(AppFeedbackService);

  /** Traer el resultado completo tarda: el boton se apaga mientras, para no lanzar dos descargas. */
  readonly exporting = signal(false);
  readonly viewModel = computed(() => ({
    search: this.store.search(),
    eventTypeFilter: this.store.eventTypeFilter(),
    statusFilter: this.store.statusFilter(),
    eventTypeOptions: this.store.eventTypeOptions(),
    events: this.store.pagedEvents(),
    totalLength: this.store.totalLength(),
    selectedEvent: this.store.selectedEvent(),
    sortField: this.store.sortField(),
    sortDirection: this.store.sortDirection(),
    drawerOpen: this.store.drawerOpen(),
    pageIndex: this.store.currentPage(),
    pageSize: this.store.pageSize(),
    loading: this.store.loading(),
    error: this.store.error(),
  }));

  ngOnInit(): void {
    void this.store.load();
  }

  updateSearch(value: string): void {
    this.store.updateSearch(value);
  }

  updateEventTypeFilter(value: string): void {
    this.store.updateEventTypeFilter(value);
  }

  updateStatusFilter(value: 'ALL' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'COMPLETED_WITH_ERRORS'): void {
    this.store.updateStatusFilter(value);
  }

  selectEvent(event: Parameters<AuditStore['selectEvent']>[0]): void {
    this.store.selectEvent(event);
  }

  updatePagination(event: PageEvent): void {
    this.store.updatePagination(event.pageIndex, event.pageSize);
  }

  closeDrawer(): void {
    this.store.closeDrawer();
  }

  refresh(): void {
    void this.store.load();
  }

  async exportCsv(): Promise<void> {
    await this.exportar((events) => eventsToCsv(this.i18n, events), 'csv', 'text/csv');
  }

  async exportJson(): Promise<void> {
    await this.exportar((events) => eventsToJson(events), 'json', 'application/json');
  }

  /**
   * Exporta la CONSULTA, no la pagina visible.
   *
   * <p>El rotulo dice "Exportar CSV" y hasta ahora bajaba los 8 registros de la pagina actual. Nadie
   * lo notaba: el fichero se abre despues, fuera de la pantalla que lo genero, y no hay con que
   * comparar. Un auditor archivaba 8 filas de una consulta de miles creyendolas completas.</p>
   *
   * <p>Cuando la consulta supera el tope, la constancia de que falta algo viaja en el NOMBRE DEL
   * FICHERO, no solo en un aviso de pantalla que se cierra y se olvida. Meterlo como una linea
   * dentro del CSV romperia a quien lo parsee, y ese remedio seria peor.</p>
   */
  private async exportar(
    serializar: (events: AuditRecord[]) => string,
    extension: string,
    mimeType: string,
  ): Promise<void> {
    if (this.exporting()) { return; }
    this.exporting.set(true);
    try {
      const { events, total, truncado } = await this.store.fetchForExport();
      if (events.length === 0) { return; }

      const sufijo = truncado ? `-parcial-${events.length}-de-${total}` : '';
      downloadText(serializar(events), `audit-events${sufijo}-${Date.now()}.${extension}`, mimeType);

      if (truncado) {
        this.feedback.info('audit.exportTruncated', { exportadas: events.length, total });
      }
    } catch (error) {
      this.feedback.handleHttpError(error as HttpErrorResponse);
    } finally {
      this.exporting.set(false);
    }
  }
}
