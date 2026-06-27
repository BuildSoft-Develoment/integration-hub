import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ConnectionProviderType } from '@integration-hub/core/providers';
import { TablePreferencesService, sortData, SortState } from '@integration-hub/core/services';

import { ConnectionApiService } from '../api/connection-api.service';
import { ConnectionRecord } from '../models/connection.models';

export type ConnectionStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
const TABLE_ID = 'connections';

@Injectable()
export class ConnectionCatalogQueryStore implements OnDestroy {
  private readonly api = inject(ConnectionApiService);
  private readonly prefs = inject(TablePreferencesService);
  private readonly searchDebounceMs = 300;
  private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private requestSequence = 0;

  readonly loading = signal(false);
  readonly connections = signal<ConnectionRecord[]>([]);
  readonly totalLength = signal(0);
  readonly search = signal('');
  readonly typeFilter = signal<'ALL' | ConnectionProviderType>('ALL');
  readonly statusFilter = signal<ConnectionStatusFilter>('ALL');
  readonly selectedConnectionId = signal<number | null>(null);
  readonly selectedConnection = signal<ConnectionRecord | null>(null);
  readonly drawerOpen = signal(false);
  readonly selectedIds = signal<Set<number>>(new Set());

  readonly isAllSelected = computed(() => {
    const ids = this.selectedIds();
    const items = this.connections();
    return items.length > 0 && items.every((item) => ids.has(item.id));
  });
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);

  readonly sortField = signal<string | null>(this.prefs.getSort(TABLE_ID)?.field ?? null);
  readonly sortDirection = signal<'asc' | 'desc'>(this.prefs.getSort(TABLE_ID)?.direction ?? 'asc');

  private readonly sort = computed<SortState | null>(() => {
    const field = this.sortField();
    return field ? { field, direction: this.sortDirection() } : null;
  });

  readonly pagedConnections = computed(() => {
    const data = this.connections();
    const s = this.sort();
    return s ? sortData(data, s) : data;
  });

  async load(): Promise<void> {
    await this.loadConnections(true);
  }

  ngOnDestroy(): void {
    this.clearSearchDebounce();
  }

  selectConnection(connection: ConnectionRecord): void {
    this.selectedConnectionId.set(connection.id);
    this.selectedConnection.set(connection);
    this.drawerOpen.set(true);
  }

  openDrawer(): void {
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  toggleSelection(id: number): void {
    this.selectedIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.connections().map((c) => c.id)));
    }
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.clearSearchDebounce();
    this.pageSize.set(pageSize);
    this.currentPage.set(pageIndex);
    void this.loadConnections(false);
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.scheduleSearchReload();
  }

  updateTypeFilter(value: 'ALL' | ConnectionProviderType): void {
    this.typeFilter.set(value);
    this.clearSearchDebounce();
    void this.loadConnections(true);
  }

  updateStatusFilter(value: ConnectionStatusFilter): void {
    this.statusFilter.set(value);
    this.clearSearchDebounce();
    void this.loadConnections(true);
  }

  markSelectedConnection(connection: ConnectionRecord): void {
    this.selectedConnectionId.set(connection.id);
    this.selectedConnection.set(connection);
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
    await this.loadConnections(false);
  }

  private async loadConnections(resetPage: boolean): Promise<void> {
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

      this.connections.set(response.items);
      this.totalLength.set(response.total);

      const selectedId = this.selectedConnectionId();
      if (selectedId != null) {
        const refreshed = response.items.find((item) => item.id === selectedId);
        if (refreshed) {
          this.selectedConnection.set(refreshed);
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
      void this.loadConnections(true);
    }, this.searchDebounceMs);
  }

  private clearSearchDebounce(): void {
    if (this.searchDebounceHandle != null) {
      clearTimeout(this.searchDebounceHandle);
      this.searchDebounceHandle = null;
    }
  }
}
