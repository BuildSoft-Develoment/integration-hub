import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ReaderProviderType } from '@integration-hub/core/providers';

import { ReaderApiService } from '../api/reader-api.service';
import { ReaderRecord } from '../models/reader.models';

@Injectable()
export class ReaderCatalogQueryStore implements OnDestroy {
  private readonly api = inject(ReaderApiService);
  private readonly searchDebounceMs = 300;
  private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private requestSequence = 0;

  readonly loading = signal(false);
  readonly readers = signal<ReaderRecord[]>([]);
  readonly totalLength = signal(0);
  readonly search = signal('');
  readonly typeFilter = signal<'ALL' | ReaderProviderType>('ALL');
  readonly selectedReaderId = signal<number | null>(null);
  readonly selectedReader = signal<ReaderRecord | null>(null);
  readonly drawerOpen = signal(false);
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);

  readonly pagedReaders = computed(() => this.readers());

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

  markSelectedReader(reader: ReaderRecord): void {
    this.selectedReaderId.set(reader.id);
    this.selectedReader.set(reader);
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
          page: this.currentPage(),
          size: this.pageSize(),
        })
      );

      if (requestId !== this.requestSequence) {
        return;
      }

      this.readers.set(response.items);
      this.totalLength.set(response.total);

      const selectedId = this.selectedReaderId();
      if (selectedId != null) {
        const refreshed = response.items.find((item) => item.id === selectedId);
        if (refreshed) {
          this.selectedReader.set(refreshed);
        }
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
