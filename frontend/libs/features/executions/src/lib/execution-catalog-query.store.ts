import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ExecutionApiService, ExecutionModeFilter } from './execution-api.service';
import { ExecutionDetailStore } from './execution-detail.store';
import { ProcessExecutionRecord } from './execution.models';

export type ExecutionStatusFilter =
  | 'ALL'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'COMPLETED_WITH_ERRORS';

@Injectable()
export class ExecutionCatalogQueryStore implements OnDestroy {
  private readonly api = inject(ExecutionApiService);
  private readonly detail = inject(ExecutionDetailStore);
  private readonly searchDebounceMs = 300;
  private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private requestSequence = 0;

  readonly loading = signal(false);
  readonly executions = signal<ProcessExecutionRecord[]>([]);
  readonly totalLength = signal(0);
  readonly search = signal('');
  readonly modeFilter = signal<ExecutionModeFilter>('ALL');
  readonly statusFilter = signal<ExecutionStatusFilter>('ALL');
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);

  readonly pagedExecutions = computed(() => this.executions());

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

  updatePagination(pageIndex: number, pageSize: number): void {
    this.clearSearchDebounce();
    this.pageSize.set(pageSize);
    this.currentPage.set(pageIndex);
    void this.loadExecutions(false);
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
          page: this.currentPage(),
          size: this.pageSize(),
        })
      );

      if (requestId !== this.requestSequence) {
        return;
      }

      this.executions.set(response.items);
      this.totalLength.set(response.total);

      const selectedId = this.detail.selectedExecutionId();
      if (selectedId != null) {
        const refreshed = response.items.find((item) => item.id === selectedId);
        if (refreshed) {
          this.detail.refreshSelectedExecution(refreshed);
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
