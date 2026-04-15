import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppFeedbackService, AuthService } from '@integration-hub/core/services';
import { ScheduleRecord } from './schedules.models';
import { SchedulesApiService } from './schedules-api.service';

type ModeFilter = 'ALL' | 'SCHEDULED' | 'MANUAL';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Injectable()
export class SchedulesStore {
  private readonly api = inject(SchedulesApiService);
  private readonly auth = inject(AuthService);
  private readonly feedback = inject(AppFeedbackService);

  readonly loading = signal(false);
  readonly executing = signal(false);
  readonly schedules = signal<ScheduleRecord[]>([]);
  readonly search = signal('');
  readonly modeFilter = signal<ModeFilter>('ALL');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly selectedScheduleId = signal<number | null>(null);
  readonly drawerOpen = signal(false);
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);

  readonly canOperate = computed(() => this.auth.hasAnyRole(['platform-admin', 'integration-admin', 'operator']));

  readonly filteredSchedules = computed(() => {
    const search = this.search().trim().toLowerCase();
    const mode = this.modeFilter();
    const status = this.statusFilter();

    return this.schedules().filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search) ||
        String(item.id).includes(search) ||
        (item.description ?? '').toLowerCase().includes(search);
      const matchesMode =
        mode === 'ALL' ||
        (mode === 'SCHEDULED' && item.scheduled) ||
        (mode === 'MANUAL' && !item.scheduled);
      const matchesStatus =
        status === 'ALL' ||
        (status === 'ACTIVE' && item.active) ||
        (status === 'INACTIVE' && !item.active);
      return matchesSearch && matchesMode && matchesStatus;
    });
  });

  readonly pagedSchedules = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.filteredSchedules().slice(start, start + this.pageSize());
  });

  readonly selectedSchedule = computed(
    () => this.schedules().find((item) => item.id === this.selectedScheduleId()) ?? null
  );

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.schedules.set(await firstValueFrom(this.api.list()));
      this.currentPage.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  selectSchedule(schedule: ScheduleRecord): void {
    this.selectedScheduleId.set(schedule.id);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.currentPage.set(0);
  }

  updateModeFilter(value: ModeFilter): void {
    this.modeFilter.set(value);
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

  async execute(schedule: ScheduleRecord): Promise<void> {
    this.executing.set(true);
    try {
      await firstValueFrom(this.api.execute(schedule.id));
      this.feedback.info('schedules.executed', { name: schedule.name });
    } finally {
      this.executing.set(false);
    }
  }
}
