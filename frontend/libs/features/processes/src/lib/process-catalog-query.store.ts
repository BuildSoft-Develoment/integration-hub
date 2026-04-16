import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ProcessApiService } from './process-api.service';
import { ProcessEditorStore } from './process-editor.store';
import { ProcessRecord } from './process.models';

type ScheduleFilter = 'ALL' | 'MANUAL' | 'SCHEDULED';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Injectable()
export class ProcessCatalogQueryStore implements OnDestroy {
  private readonly api = inject(ProcessApiService);
  private readonly editor = inject(ProcessEditorStore);
  private readonly searchDebounceMs = 300;
  private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private requestSequence = 0;

  readonly loading = signal(false);
  readonly processes = signal<ProcessRecord[]>([]);
  readonly totalLength = signal(0);
  readonly search = signal('');
  readonly scheduleFilter = signal<ScheduleFilter>('ALL');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);

  readonly pagedProcesses = computed(() => this.processes());

  async load(): Promise<void> {
    await this.loadProcesses(true);
  }

  ngOnDestroy(): void {
    this.clearSearchDebounce();
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.clearSearchDebounce();
    this.pageSize.set(pageSize);
    this.currentPage.set(pageIndex);
    void this.loadProcesses(false);
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.scheduleSearchReload();
  }

  updateScheduleFilter(value: ScheduleFilter): void {
    this.scheduleFilter.set(value);
    this.clearSearchDebounce();
    void this.loadProcesses(true);
  }

  updateStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.clearSearchDebounce();
    void this.loadProcesses(true);
  }

  async reload(): Promise<void> {
    await this.loadProcesses(false);
  }

  private async loadProcesses(resetPage: boolean): Promise<void> {
    if (resetPage) {
      this.currentPage.set(0);
    }

    const requestId = ++this.requestSequence;
    this.loading.set(true);
    try {
      const response = await firstValueFrom(
        this.api.list({
          search: this.search(),
          mode: this.scheduleFilter(),
          status: this.statusFilter(),
          page: this.currentPage(),
          size: this.pageSize(),
        })
      );

      if (requestId !== this.requestSequence) {
        return;
      }

      this.processes.set(response.items);
      this.totalLength.set(response.total);

      const selectedId = this.editor.selectedProcessId();
      if (selectedId != null) {
        const refreshed = response.items.find((item) => item.id === selectedId);
        if (refreshed) {
          this.editor.refreshSelectedProcess(refreshed);
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
      void this.loadProcesses(true);
    }, this.searchDebounceMs);
  }

  private clearSearchDebounce(): void {
    if (this.searchDebounceHandle != null) {
      clearTimeout(this.searchDebounceHandle);
      this.searchDebounceHandle = null;
    }
  }
}
