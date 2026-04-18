import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  AppFeedbackService,
  AuthAccessService,
} from '@integration-hub/core/services';
import { ScheduleRecord } from '../models/schedules.models';
import { SchedulesApiService } from '../api/schedules-api.service';

type ModeFilter = 'ALL' | 'SCHEDULED' | 'MANUAL';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Injectable()
export class SchedulesStore implements OnDestroy {
  private readonly api = inject(SchedulesApiService);
  private readonly access = inject(AuthAccessService);
  private readonly feedback = inject(AppFeedbackService);
  private readonly searchDebounceMs = 300;
  private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private requestSequence = 0;

  readonly loading = signal(false);
  readonly executing = signal(false);
  readonly schedules = signal<ScheduleRecord[]>([]);
  readonly totalLength = signal(0);
  readonly search = signal('');
  readonly modeFilter = signal<ModeFilter>('ALL');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly selectedScheduleId = signal<number | null>(null);
  readonly selectedSchedule = signal<ScheduleRecord | null>(null);
  readonly drawerOpen = signal(false);
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);

  readonly canOperate = computed(() => this.access.canOperate());
  readonly pagedSchedules = computed(() => this.schedules());

  async load(): Promise<void> {
    await this.loadSchedules(true);
  }

  ngOnDestroy(): void {
    this.clearSearchDebounce();
  }

  selectSchedule(schedule: ScheduleRecord): void {
    this.selectedScheduleId.set(schedule.id);
    this.selectedSchedule.set(schedule);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.scheduleSearchReload();
  }

  updateModeFilter(value: ModeFilter): void {
    this.modeFilter.set(value);
    this.clearSearchDebounce();
    void this.loadSchedules(true);
  }

  updateStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.clearSearchDebounce();
    void this.loadSchedules(true);
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.clearSearchDebounce();
    this.pageSize.set(pageSize);
    this.currentPage.set(pageIndex);
    void this.loadSchedules(false);
  }

  async execute(schedule: ScheduleRecord): Promise<void> {
    if (!schedule.scheduled) {
      this.feedback.info('schedules.manualExecutionBlocked');
      return;
    }

    this.executing.set(true);
    try {
      await firstValueFrom(this.api.execute(schedule.id));
      this.feedback.info('schedules.executed', { name: schedule.name });
      await this.loadSchedules(false);
    } finally {
      this.executing.set(false);
    }
  }

  private async loadSchedules(resetPage: boolean): Promise<void> {
    if (resetPage) {
      this.currentPage.set(0);
    }

    const requestId = ++this.requestSequence;
    this.loading.set(true);
    try {
      const response = await firstValueFrom(
        this.api.list({
          search: this.search(),
          mode: this.modeFilter(),
          status: this.statusFilter(),
          page: this.currentPage(),
          size: this.pageSize(),
        })
      );

      if (requestId !== this.requestSequence) {
        return;
      }

      this.schedules.set(response.items);
      this.totalLength.set(response.total);
      this.syncSelectedSchedule(response.items);
    } finally {
      if (requestId === this.requestSequence) {
        this.loading.set(false);
      }
    }
  }

  private syncSelectedSchedule(items: readonly ScheduleRecord[]): void {
    const selectedId = this.selectedScheduleId();
    if (selectedId == null) {
      return;
    }

    const refreshed = items.find((item) => item.id === selectedId) ?? null;
    this.selectedSchedule.set(refreshed);
    if (!refreshed) {
      this.drawerOpen.set(false);
    }
  }

  private scheduleSearchReload(): void {
    this.clearSearchDebounce();
    this.searchDebounceHandle = setTimeout(() => {
      this.searchDebounceHandle = null;
      void this.loadSchedules(true);
    }, this.searchDebounceMs);
  }

  private clearSearchDebounce(): void {
    if (this.searchDebounceHandle != null) {
      clearTimeout(this.searchDebounceHandle);
      this.searchDebounceHandle = null;
    }
  }
}
