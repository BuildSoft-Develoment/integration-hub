import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuditApiService } from './audit-api.service';
import { AuditRecord } from './audit.models';

type StatusFilter = 'ALL' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'COMPLETED_WITH_ERRORS';

@Injectable()
export class AuditStore implements OnDestroy {
  private readonly api = inject(AuditApiService);
  private readonly searchDebounceMs = 300;
  private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private requestSequence = 0;

  readonly loading = signal(false);
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

  readonly pagedEvents = computed(() => this.events());

  async load(): Promise<void> {
    await this.loadEvents(true);
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
