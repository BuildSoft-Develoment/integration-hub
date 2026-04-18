import { Injectable, computed, signal } from '@angular/core';

import {
  createEmptyProcessedFileFilters,
  fileReference,
  filterProcessedFileRows,
} from '../../details/execution-detail.utils';
import {
  ProcessTaskExecutionRecord,
  ProcessedFileFilters,
  ProcessedSourceFileRecord,
} from '../../models/execution.models';

@Injectable()
export class ExecutionFilesPanelStore {
  readonly task = signal<ProcessTaskExecutionRecord | null>(null);
  readonly filters = signal<ProcessedFileFilters>(createEmptyProcessedFileFilters());
  readonly selectedKeys = signal<string[]>([]);

  readonly allFiles = computed(() => this.task()?.processedFiles ?? []);
  readonly filteredFiles = computed(() =>
    filterProcessedFileRows(this.allFiles(), this.filters())
  );
  readonly completedFiles = computed(() =>
    this.filteredFiles().filter((item) => item.status === 'COMPLETED')
  );
  readonly failedFiles = computed(() =>
    this.filteredFiles().filter((item) => item.status === 'FAILED')
  );
  readonly pendingFiles = computed(() =>
    this.filteredFiles().filter((item) => item.status === 'PENDING')
  );
  readonly selectedRows = computed(() =>
    this.filteredFiles().filter((item) => this.selectedKeys().includes(this.rowKey(item)))
  );

  readonly quickFilters = [
    { value: '', label: 'Todos' },
    { value: 'COMPLETED', label: 'Completados' },
    { value: 'FAILED', label: 'Fallidos' },
    { value: 'PENDING', label: 'Pendientes' },
  ] as const;

  syncTask(task: ProcessTaskExecutionRecord | null): void {
    const previousTaskId = this.task()?.id ?? null;
    const nextTaskId = task?.id ?? null;

    this.task.set(task);
    if (previousTaskId !== nextTaskId) {
      this.clearFiltersAndSelection();
    }
  }

  updateFilters(patch: Partial<ProcessedFileFilters>): void {
    this.filters.update((current) => ({ ...current, ...patch }));
  }

  setStatusFilter(status: string): void {
    this.updateFilters({ status });
  }

  clearFiltersAndSelection(): void {
    this.filters.set(createEmptyProcessedFileFilters());
    this.selectedKeys.set([]);
  }

  toggleRow(file: ProcessedSourceFileRecord, checked: boolean): void {
    const key = this.rowKey(file);
    if (!key) {
      return;
    }

    this.selectedKeys.update((current) =>
      checked ? Array.from(new Set([...current, key])) : current.filter((item) => item !== key)
    );
  }

  toggleAllVisible(checked: boolean): void {
    const visibleKeys = this.filteredFiles()
      .map((item) => this.rowKey(item))
      .filter(Boolean);

    this.selectedKeys.update((current) =>
      checked
        ? Array.from(new Set([...current, ...visibleKeys]))
        : current.filter((item) => !visibleKeys.includes(item))
    );
  }

  isSelected(file: ProcessedSourceFileRecord): boolean {
    return this.selectedKeys().includes(this.rowKey(file));
  }

  isAllVisibleSelected(): boolean {
    return (
      this.filteredFiles().length > 0 &&
      this.filteredFiles().every((item) => this.isSelected(item))
    );
  }

  isPartiallySelected(): boolean {
    return (
      this.filteredFiles().some((item) => this.isSelected(item)) &&
      !this.isAllVisibleSelected()
    );
  }

  rowKey(file: ProcessedSourceFileRecord): string {
    return fileReference(file) || String(file.id);
  }

  statusClass(status: string | null): string {
    switch (status) {
      case 'COMPLETED':
        return 'status-pill status-pill--completed';
      case 'FAILED':
        return 'status-pill status-pill--failed';
      case 'PENDING':
        return 'status-pill status-pill--pending';
      default:
        return 'status-pill';
    }
  }
}
