import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { SourceProviderType } from '@integration-hub/core/providers';
import { TablePreferencesService, sortData, SortState } from '@integration-hub/core/services';

import { SourceApiService } from '../api/source-api.service';
import { SourceDirection, SourceRecord } from '../models/source.models';

export type SourceStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
const TABLE_ID = 'sources';

@Injectable()
export class SourceCatalogQueryStore implements OnDestroy {
  private readonly api = inject(SourceApiService);
  private readonly prefs = inject(TablePreferencesService);
  private readonly searchDebounceMs = 300;
  private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private requestSequence = 0;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly sources = signal<SourceRecord[]>([]);
  readonly totalLength = signal(0);
  readonly search = signal('');
  readonly typeFilter = signal<'ALL' | SourceProviderType>('ALL');
  readonly statusFilter = signal<SourceStatusFilter>('ALL');
  readonly directionFilter = signal<'ALL' | SourceDirection>('ALL');
  readonly selectedSourceId = signal<number | null>(null);
  readonly selectedSource = signal<SourceRecord | null>(null);
  readonly drawerOpen = signal(false);
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);

  readonly sortField = signal<string | null>(this.prefs.getSort(TABLE_ID)?.field ?? null);
  readonly sortDirection = signal<'asc' | 'desc'>(this.prefs.getSort(TABLE_ID)?.direction ?? 'asc');

  private readonly sort = computed<SortState | null>(() => {
    const field = this.sortField();
    return field ? { field, direction: this.sortDirection() } : null;
  });

  readonly pagedSources = computed(() => {
    const data = this.sources();
    const s = this.sort();
    return s ? sortData(data, s) : data;
  });

  async load(): Promise<void> {
    await this.loadSources(true);
  }

  ngOnDestroy(): void {
    this.clearSearchDebounce();
  }

  selectSource(source: SourceRecord): void {
    this.selectedSourceId.set(source.id);
    this.selectedSource.set(source);
    this.drawerOpen.set(true);
  }

  openDrawer(): void {
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.clearSearchDebounce();
    this.pageSize.set(pageSize);
    this.currentPage.set(pageIndex);
    void this.loadSources(false);
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.scheduleSearchReload();
  }

  updateTypeFilter(value: 'ALL' | SourceProviderType): void {
    this.typeFilter.set(value);
    this.clearSearchDebounce();
    void this.loadSources(true);
  }

  updateStatusFilter(value: SourceStatusFilter): void {
    this.statusFilter.set(value);
    this.clearSearchDebounce();
    void this.loadSources(true);
  }

  updateDirectionFilter(value: 'ALL' | SourceDirection): void {
    this.directionFilter.set(value);
    this.clearSearchDebounce();
    void this.loadSources(true);
  }

  markSelectedSource(source: SourceRecord): void {
    this.selectedSourceId.set(source.id);
    this.selectedSource.set(source);
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
    await this.loadSources(false);
  }

  private async loadSources(resetPage: boolean): Promise<void> {
    if (resetPage) {
      this.currentPage.set(0);
    }

    const requestId = ++this.requestSequence;
    this.loading.set(true);

    try {
      const response = await firstValueFrom(
        this.api.list({
          search: this.search(),
          type: this.typeFilter(),
          status: this.statusFilter(),
          direction: this.directionFilter(),
          page: this.currentPage(),
          size: this.pageSize(),
        })
      );

      if (requestId !== this.requestSequence) {
        return;
      }

      this.sources.set(response.items);
      this.totalLength.set(response.total);
      this.error.set(null);

      const selectedId = this.selectedSourceId();
      if (selectedId != null) {
        const refreshed = response.items.find((item) => item.id === selectedId);
        if (refreshed) {
          this.selectedSource.set(refreshed);
        }
      }
    } catch {
      if (requestId === this.requestSequence) {
        this.error.set('sources.loadError');
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
      void this.loadSources(true);
    }, this.searchDebounceMs);
  }

  private clearSearchDebounce(): void {
    if (this.searchDebounceHandle != null) {
      clearTimeout(this.searchDebounceHandle);
      this.searchDebounceHandle = null;
    }
  }
}
