import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ReaderProviderType } from '@integration-hub/core/providers';
import { TablePreferencesService, sortData, SortState } from '@integration-hub/core/services';

import { ReaderApiService } from '../api/reader-api.service';
import { ReaderRecord } from '../models/reader.models';

const TABLE_ID = 'readers';

@Injectable()
export class ReaderCatalogQueryStore implements OnDestroy {
  private readonly api = inject(ReaderApiService);
  private readonly prefs = inject(TablePreferencesService);
  private readonly searchDebounceMs = 300;
  private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private requestSequence = 0;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly readers = signal<ReaderRecord[]>([]);
  readonly totalLength = signal(0);
  readonly search = signal('');
  readonly typeFilter = signal<'ALL' | ReaderProviderType>('ALL');
  readonly statusFilter = signal<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  readonly selectedReaderId = signal<number | null>(null);
  readonly selectedReader = signal<ReaderRecord | null>(null);
  readonly drawerOpen = signal(false);
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);

  readonly sortField = signal<string | null>(this.prefs.getSort(TABLE_ID)?.field ?? null);
  readonly sortDirection = signal<'asc' | 'desc'>(this.prefs.getSort(TABLE_ID)?.direction ?? 'asc');

  private readonly sort = computed<SortState | null>(() => {
    const field = this.sortField();
    return field ? { field, direction: this.sortDirection() } : null;
  });

  readonly pagedReaders = computed(() => {
    const data = this.readers();
    const s = this.sort();
    return s ? sortData(data, s) : data;
  });

  async load(): Promise<void> {
    await this.loadReaders(true);
  }

  ngOnDestroy(): void {
    this.clearSearchDebounce();
  }

  selectReader(reader: ReaderRecord): void {
    this.selectedReaderId.set(reader.id);
    this.selectedReader.set(reader);
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
    void this.loadReaders(false);
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.scheduleSearchReload();
  }

  updateTypeFilter(value: 'ALL' | ReaderProviderType): void {
    this.typeFilter.set(value);
    this.clearSearchDebounce();
    void this.loadReaders(true);
  }

  updateStatusFilter(value: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.statusFilter.set(value);
    this.clearSearchDebounce();
    void this.loadReaders(true);
  }

  markSelectedReader(reader: ReaderRecord): void {
    this.selectedReaderId.set(reader.id);
    this.selectedReader.set(reader);
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
    await this.loadReaders(false);
  }

  private async loadReaders(resetPage: boolean): Promise<void> {
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
          page: this.currentPage(),
          size: this.pageSize(),
        })
      );

      if (requestId !== this.requestSequence) {
        return;
      }

      this.readers.set(response.items);
      this.totalLength.set(response.total);
      this.error.set(null);

      const selectedId = this.selectedReaderId();
      if (selectedId != null) {
        const refreshed = response.items.find((item) => item.id === selectedId);
        if (refreshed) {
          this.selectedReader.set(refreshed);
        }
      }
    } catch {
      if (requestId === this.requestSequence) {
        this.error.set('readers.loadError');
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
      void this.loadReaders(true);
    }, this.searchDebounceMs);
  }

  private clearSearchDebounce(): void {
    if (this.searchDebounceHandle != null) {
      clearTimeout(this.searchDebounceHandle);
      this.searchDebounceHandle = null;
    }
  }
}
