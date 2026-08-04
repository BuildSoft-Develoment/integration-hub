import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AppFeedbackService, TablePreferencesService, sortData, SortState } from '@integration-hub/core/services';
import { AuditApiService } from '../api/audit-api.service';
import { AuditRecord } from '../models/audit.models';

type StatusFilter = 'ALL' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'COMPLETED_WITH_ERRORS';

const TABLE_ID = 'audit';

/**
 * Tope de filas por exportacion.
 *
 * No es una cifra de compromiso: es lo que un navegador puede convertir en CSV y descargar sin
 * bloquear la pestana. Superarlo NO se disimula — quien exporta se entera de cuantas quedaron fuera
 * y el propio nombre del fichero lo dice.
 */
export const EXPORT_MAX_ROWS = 10_000;

@Injectable()
export class AuditStore implements OnDestroy {
  private readonly api = inject(AuditApiService);
  private readonly prefs = inject(TablePreferencesService);
  private readonly feedback = inject(AppFeedbackService);
  private readonly searchDebounceMs = 300;
  private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private requestSequence = 0;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly events = signal<AuditRecord[]>([]);
  readonly totalLength = signal(0);
  readonly eventTypeOptions = signal<string[]>([]);
  readonly search = signal('');
  readonly eventTypeFilter = signal('ALL');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly selectedEvent = signal<AuditRecord | null>(null);
  readonly drawerOpen = signal(false);
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);

  readonly sortField = signal<string | null>(this.prefs.getSort(TABLE_ID)?.field ?? null);
  readonly sortDirection = signal<'asc' | 'desc'>(this.prefs.getSort(TABLE_ID)?.direction ?? 'asc');

  private readonly sort = computed<SortState | null>(() => {
    const field = this.sortField();
    return field ? { field, direction: this.sortDirection() } : null;
  });

  readonly pagedEvents = computed(() => {
    const data = this.events();
    const s = this.sort();
    return s ? sortData(data, s) : data;
  });

  async load(): Promise<void> {
    await this.loadEvents(true);
  }

  /**
   * Trae el resultado FILTRADO COMPLETO para exportar, no la pagina que se esta viendo.
   *
   * <p>La exportacion usaba `pagedEvents()`, que son los 8 registros de la pagina actual. Un auditor
   * que filtraba por un rango y pulsaba "Exportar CSV" se llevaba 8 filas creyendo que se llevaba la
   * consulta. Ese fichero luego se archiva o se manda, y nada en el delata lo que falta.</p>
   *
   * <p><b>Con tope, y el tope se cuenta.</b> Sin limite, un filtro amplio sobre la auditoria puede
   * traer cientos de miles de filas al navegador y tumbar la pestana — este producto ya trabaja con
   * lotes de un millon de registros, asi que no es hipotetico. Se traen como mucho
   * {@link EXPORT_MAX_ROWS} y se devuelve `total` para que quien llame pueda DECIR cuantas quedaron
   * fuera en vez de callarlo.</p>
   */
  async fetchForExport(): Promise<{ events: AuditRecord[]; total: number; truncado: boolean }> {
    const response = await firstValueFrom(
      this.api.list({
        search: this.search(),
        eventType: this.eventTypeFilter(),
        status: this.statusFilter(),
        page: 0,
        size: EXPORT_MAX_ROWS,
      })
    );

    const s = this.sort();
    const events = s ? sortData(response.items, s) : response.items;
    return { events, total: response.total, truncado: response.total > events.length };
  }

  ngOnDestroy(): void {
    this.clearSearchDebounce();
  }

  selectEvent(event: AuditRecord): void {
    this.selectedEvent.set(event);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.clearSearchDebounce();
    this.searchDebounceHandle = setTimeout(() => {
      this.searchDebounceHandle = null;
      void this.loadEvents(true);
    }, this.searchDebounceMs);
  }

  updateEventTypeFilter(value: string): void {
    this.eventTypeFilter.set(value);
    this.clearSearchDebounce();
    void this.loadEvents(true);
  }

  updateStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.clearSearchDebounce();
    void this.loadEvents(true);
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.clearSearchDebounce();
    this.pageSize.set(pageSize);
    this.currentPage.set(pageIndex);
    void this.loadEvents(false);
  }

  toggleSort(field: string): void {
    if (this.sortField() === field) {
      const dir = this.sortDirection() === 'asc' ? 'desc' : 'asc';
      this.sortDirection.set(dir);
      this.prefs.setSort(TABLE_ID, { field, direction: dir });
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
      this.prefs.setSort(TABLE_ID, { field, direction: 'asc' });
    }
  }

  private async loadEvents(resetPage: boolean): Promise<void> {
    if (resetPage) {
      this.currentPage.set(0);
    }

    const requestId = ++this.requestSequence;
    this.loading.set(true);
    try {
      const response = await firstValueFrom(
        this.api.list({
          search: this.search(),
          eventType: this.eventTypeFilter(),
          status: this.statusFilter(),
          page: this.currentPage(),
          size: this.pageSize(),
        })
      );

      if (requestId !== this.requestSequence) {
        return;
      }

      this.events.set(response.items);
      this.totalLength.set(response.total);
      this.eventTypeOptions.set(response.eventTypeOptions);
      this.syncSelectedEvent(response.items);
      this.error.set(null);
    } catch (err) {
      if (requestId === this.requestSequence) {
        this.error.set('audit.loadError');
        this.feedback.handleHttpError(err as HttpErrorResponse);
      }
    } finally {
      if (requestId === this.requestSequence) {
        this.loading.set(false);
      }
    }
  }

  private syncSelectedEvent(items: readonly AuditRecord[]): void {
    const selectedId = this.selectedEvent()?.id;
    if (selectedId == null) {
      return;
    }

    const refreshed = items.find((item) => item.id === selectedId) ?? null;
    this.selectedEvent.set(refreshed);
    if (!refreshed) {
      this.drawerOpen.set(false);
    }
  }

  private clearSearchDebounce(): void {
    if (this.searchDebounceHandle != null) {
      clearTimeout(this.searchDebounceHandle);
      this.searchDebounceHandle = null;
    }
  }
}
