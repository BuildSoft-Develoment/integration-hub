import { Injectable, signal, computed } from '@angular/core';

import {
  buildTaskReadSummary,
  summarizeFailure,
} from '../../details/execution-detail.utils';
import {
  ProcessExecutionRecord,
  ProcessTaskExecutionRecord,
} from '../../models/execution.models';

@Injectable()
export class ExecutionEditorStore {
  readonly execution = signal<ProcessExecutionRecord | null>(null);
  readonly tasks = signal<readonly ProcessTaskExecutionRecord[]>([]);
  readonly selectedTaskId = signal<number | null>(null);

  readonly selectedTask = computed(
    () =>
      this.tasks().find((task) => task.id === this.selectedTaskId()) ??
      this.tasks()[0] ??
      null
  );
  readonly selectedTaskSummary = computed(() =>
    buildTaskReadSummary(this.selectedTask())
  );
  readonly failedTask = computed(
    () => this.tasks().find((task) => task.status === 'FAILED') ?? null
  );
  readonly failedExecutionSummary = computed(() =>
    summarizeFailure(this.failedTask()?.details || this.execution()?.details)
  );

  syncContext(
    execution: ProcessExecutionRecord | null,
    tasks: readonly ProcessTaskExecutionRecord[]
  ): void {
    this.execution.set(execution);
    this.tasks.set(tasks);

    const selectedId = this.selectedTaskId();
    if (tasks.some((task) => task.id === selectedId)) {
      return;
    }

    const preferred = tasks.find((task) => task.status === 'FAILED') ?? tasks[0] ?? null;
    this.selectedTaskId.set(preferred?.id ?? null);
  }

  selectTask(taskId: number): void {
    this.selectedTaskId.set(taskId);
  }
}
