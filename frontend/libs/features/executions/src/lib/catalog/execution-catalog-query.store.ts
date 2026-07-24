import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { TablePreferencesService, sortData, SortState } from '@integration-hub/core/services';

import { ExecutionApiService, ExecutionModeFilter } from '../api/execution-api.service';
import { ExecutionDetailStore } from '../details/execution-detail.store';
import { ProcessExecutionRecord } from '../models/execution.models';

export type ExecutionStatusFilter =
  | 'ALL'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'COMPLETED_WITH_ERRORS';

const TABLE_ID = 'executions';

@Injectable()
export class ExecutionCatalogQueryStore implements OnDestroy {
  private readonly api = inject(ExecutionApiService);
  private readonly prefs = inject(TablePreferencesService);
  private readonly detail = inject(ExecutionDetailStore);
  private readonly searchDebounceMs = 300;
  private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private requestSequence = 0;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly executions = signal<ProcessExecutionRecord[]>([]);
  readonly totalLength = signal(0);
  readonly search = signal('');
  readonly modeFilter = signal<ExecutionModeFilter>('ALL');
  readonly statusFilter = signal<ExecutionStatusFilter>('ALL');
  // 014: rango de fecha de inicio (formato datetime-local 'yyyy-MM-ddTHH:mm'; '' = sin filtro).
  readonly startedFrom = signal('');
  readonly startedTo = signal('');
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);

  readonly sortField = signal<string | null>(this.prefs.getSort(TABLE_ID)?.field ?? null);
  readonly sortDirection = signal<'asc' | 'desc'>(this.prefs.getSort(TABLE_ID)?.direction ?? 'asc');

  private readonly sort = computed<SortState | null>(() => {
    const field = this.sortField();
    return field ? { field, direction: this.sortDirection() } : null;
  });

  readonly pagedExecutions = computed(() => {
    const data = this.executions();
    const s = this.sort();
    return s ? sortData(data, s) : data;
  });

  async load(): Promise<void> {
    await this.loadExecutions(true);
  }

  ngOnDestroy(): void {
    this.clearSearchDebounce();
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.scheduleSearchReload();
  }

  updateModeFilter(value: ExecutionModeFilter): void {
    this.modeFilter.set(value);
    this.clearSearchDebounce();
    void this.loadExecutions(true);
  }

  updateStatusFilter(value: ExecutionStatusFilter): void {
    this.statusFilter.set(value);
    this.clearSearchDebounce();
    void this.loadExecutions(true);
  }

  // 014: aplica el rango de fecha de inicio y recarga (vuelve a la primera pagina).
  updateDateFilter(patch: { startedFrom?: string; startedTo?: string }): void {
    if (patch.startedFrom !== undefined) {
      this.startedFrom.set(patch.startedFrom);
    }
    if (patch.startedTo !== undefined) {
      this.startedTo.set(patch.startedTo);
    }
    this.clearSearchDebounce();
    void this.loadExecutions(true);
  }

  // Resetea TODOS los filtros a su valor neutro y recarga desde la primera pagina. No toca orden ni tamano de pagina.
  clearFilters(): void {
    this.clearSearchDebounce();
    this.search.set('');
    this.modeFilter.set('ALL');
    this.statusFilter.set('ALL');
    this.startedFrom.set('');
    this.startedTo.set('');
    void this.loadExecutions(true);
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.clearSearchDebounce();
    this.pageSize.set(pageSize);
    this.currentPage.set(pageIndex);
    void this.loadExecutions(false);
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

  async reload(): Promise<void> {
    await this.loadExecutions(false);
  }

  private async loadExecutions(resetPage: boolean): Promise<void> {
    if (resetPage) {
      this.currentPage.set(0);
    }

    const requestId = ++this.requestSequence;
    this.loading.set(true);
    try {
      const status = this.statusFilter() === 'ALL' ? null : this.statusFilter();
      const response = await firstValueFrom(
        this.api.list({
          status,
          search: this.search(),
          mode: this.modeFilter(),
          // '' -> undefined para no enviar el parametro (y no romper el assert exacto del spec).
          startedFrom: this.startedFrom() || undefined,
          startedTo: this.startedTo() || undefined,
          page: this.currentPage(),
          size: this.pageSize(),
        })
      );

      if (requestId !== this.requestSequence) {
        return;
      }

      this.executions.set(response.items);
      this.totalLength.set(response.total);
      this.error.set(null);

      const selectedId = this.detail.selectedExecutionId();
      if (selectedId != null) {
        const refreshed = response.items.find((item) => item.id === selectedId);
        if (refreshed) {
          this.detail.refreshSelectedExecution(refreshed);
        }
      }
    } catch {
      if (requestId === this.requestSequence) {
        this.error.set('executions.loadError');
      }
    } finally {
      if (requestId === this.requestSequence) {
        this.loading.set(false);
      }
    }
  }

  private scheduleSearchReload(): void {
    this.clearSearchDebounce();
    this.searchDebounceHandle = setTimeout(() => {
      this.searchDebounceHandle = null;
      void this.loadExecutions(true);
    }, this.searchDebounceMs);
  }

  private clearSearchDebounce(): void {
    if (this.searchDebounceHandle != null) {
      clearTimeout(this.searchDebounceHandle);
      this.searchDebounceHandle = null;
    }
  }
}
