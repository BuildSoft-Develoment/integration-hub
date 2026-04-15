import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuditApiService } from './audit-api.service';
import { AuditRecord } from './audit.models';

type StatusFilter = 'ALL' | 'COMPLETED' | 'FAILED' | 'PENDING';

@Injectable()
export class AuditStore {
  private readonly api = inject(AuditApiService);

  readonly loading = signal(false);
  readonly events = signal<AuditRecord[]>([]);
  readonly search = signal('');
  readonly eventTypeFilter = signal('ALL');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly selectedEventId = signal<number | null>(null);
  readonly drawerOpen = signal(false);
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);

  readonly eventTypeOptions = computed(() =>
    Array.from(new Set(this.events().map((item) => item.eventType).filter(Boolean))).sort()
  );

  readonly filteredEvents = computed(() => {
    const search = this.search().trim().toLowerCase();
    const eventType = this.eventTypeFilter();
    const status = this.statusFilter();

    return this.events().filter((item) => {
      const matchesSearch =
        !search ||
        String(item.id).includes(search) ||
        String(item.processExecutionId ?? '').includes(search) ||
        String(item.taskDefinitionId ?? '').includes(search) ||
        item.eventType.toLowerCase().includes(search) ||
        (item.message ?? '').toLowerCase().includes(search);
      const matchesEventType = eventType === 'ALL' || item.eventType === eventType;
      const matchesStatus = status === 'ALL' || item.status === status;
      return matchesSearch && matchesEventType && matchesStatus;
    });
  });

  readonly pagedEvents = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.filteredEvents().slice(start, start + this.pageSize());
  });

  readonly selectedEvent = computed(
    () => this.events().find((item) => item.id === this.selectedEventId()) ?? null
  );

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.events.set(await firstValueFrom(this.api.list()));
      this.currentPage.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  selectEvent(event: AuditRecord): void {
    this.selectedEventId.set(event.id);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.currentPage.set(0);
  }

  updateEventTypeFilter(value: string): void {
    this.eventTypeFilter.set(value);
    this.currentPage.set(0);
  }

  updateStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.currentPage.set(0);
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(pageIndex);
  }
}
