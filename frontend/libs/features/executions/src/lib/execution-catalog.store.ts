import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ExecutionApiService } from './execution-api.service';
import { ProcessExecutionRecord, ProcessTaskExecutionRecord } from './execution.models';

type StatusFilter = 'ALL' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'COMPLETED_WITH_ERRORS';

@Injectable()
export class ExecutionCatalogStore {
  private readonly api = inject(ExecutionApiService);

  readonly loading = signal(false);
  readonly loadingDetails = signal(false);
  readonly executions = signal<ProcessExecutionRecord[]>([]);
  readonly tasks = signal<ProcessTaskExecutionRecord[]>([]);
  readonly search = signal('');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly selectedExecutionId = signal<number | null>(null);
  readonly drawerOpen = signal(false);
  readonly currentPage = signal(0);
  readonly pageSize = signal(8);

  readonly filteredExecutions = computed(() => {
    const search = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    return this.executions().filter((item) => {
      const matchesSearch =
        !search ||
        item.processName.toLowerCase().includes(search) ||
        String(item.id).includes(search) ||
        String(item.processDefinitionId).includes(search);
      const matchesStatus = status === 'ALL' || item.status === status;
      return matchesSearch && matchesStatus;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredExecutions().length / this.pageSize())));

  readonly pagedExecutions = computed(() => {
    const pageIndex = Math.min(this.currentPage(), this.totalPages() - 1);
    const start = pageIndex * this.pageSize();
    return this.filteredExecutions().slice(start, start + this.pageSize());
  });

  readonly selectedExecution = computed(
    () => this.executions().find((item) => item.id === this.selectedExecutionId()) ?? null
  );

  async load(): Promise<void> {
    await this.loadExecutions(true);
  }

  private async loadExecutions(resetPage: boolean): Promise<void> {
    this.loading.set(true);
    try {
      const status = this.statusFilter() === 'ALL' ? null : this.statusFilter();
      const executions = await firstValueFrom(this.api.list({ status, page: 0, size: 100 }));
      this.executions.set(executions);
      if (resetPage) {
        this.currentPage.set(0);
      } else {
        this.currentPage.set(
          Math.max(0, Math.min(this.currentPage(), Math.ceil(this.filteredExecutions().length / this.pageSize()) - 1 || 0))
        );
      }
      if (this.selectedExecutionId() && !executions.some((item) => item.id === this.selectedExecutionId())) {
        this.selectedExecutionId.set(null);
        this.tasks.set([]);
        this.drawerOpen.set(false);
      }
    } finally {
      this.loading.set(false);
    }
  }

  async selectExecution(execution: ProcessExecutionRecord): Promise<void> {
    this.selectedExecutionId.set(execution.id);
    this.drawerOpen.set(true);
    this.loadingDetails.set(true);
    try {
      const [detail, tasks] = await Promise.all([
        firstValueFrom(this.api.get(execution.id)),
        firstValueFrom(this.api.listTasks(execution.id)),
      ]);
      this.executions.update((current) => current.map((item) => (item.id === detail.id ? detail : item)));
      this.tasks.set(tasks);
    } finally {
      this.loadingDetails.set(false);
    }
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.currentPage.set(0);
  }

  updateStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
    void this.loadExecutions(true);
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(Math.max(0, Math.min(pageIndex, Math.ceil(this.filteredExecutions().length / pageSize) - 1 || 0)));
  }
}
