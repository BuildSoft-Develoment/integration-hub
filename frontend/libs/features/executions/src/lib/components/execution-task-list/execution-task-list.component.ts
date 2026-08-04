import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { resolveVocabulary } from '@integration-hub/core/i18n';
import { DateTimeService, I18nService } from '@integration-hub/core/services';
import {
  buildTaskDbWriteSummary,
  buildTaskReadSummary,
  downloadSkippedRowsCsv,
  formatExecutionDate,
  formatTaskOutputValue,
  summarizeFailure,
  taskOutputEntries,
} from '../../details/execution-detail.utils';
import {
  ExecutionProgress,
  ProcessTaskExecutionRecord,
  SyncTaskProgress,
  TaskScatterProgress,
} from '../../models/execution.models';

@Component({
  selector: 'ih-execution-task-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatExpansionModule, MatProgressBarModule, RouterLink],
    templateUrl: './execution-task-list.component.html',
    styleUrl: './execution-task-list.component.css'
})
export class ExecutionTaskListComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);

  readonly tasks = input.required<readonly ProcessTaskExecutionRecord[]>();
  readonly progress = input<ExecutionProgress | null>(null);
  readonly selectedTaskId = input<number | null>(null);
  readonly selectTask = output<number>();

  // Índices por taskDefinitionId para correlacionar el progreso con la fila de tarea.
  private readonly scatterByTask = computed(() => {
    const map = new Map<number, TaskScatterProgress>();
    for (const p of this.progress()?.scatterTasks ?? []) {
      map.set(p.taskDefinitionId, p);
    }
    return map;
  });

  private readonly syncByTask = computed(() => {
    const map = new Map<number, SyncTaskProgress>();
    for (const p of this.progress()?.syncTasks ?? []) {
      map.set(p.taskDefinitionId, p);
    }
    return map;
  });

  /** Salud del backbone async embebida en el progreso; muestra el chip solo si hay algo que reportar. */
  readonly pipeline = computed(() => this.progress()?.pipeline ?? null);
  readonly pipelineDeadCount = computed(() => {
    const p = this.pipeline();
    return p ? p.outboxDead + p.inboxDead + p.inboxPoison : 0;
  });

  scatterFor(task: ProcessTaskExecutionRecord): TaskScatterProgress | null {
    return this.scatterByTask().get(task.taskDefinitionId) ?? null;
  }

  syncFor(task: ProcessTaskExecutionRecord): SyncTaskProgress | null {
    return this.syncByTask().get(task.taskDefinitionId) ?? null;
  }

  readSummary(task: ProcessTaskExecutionRecord) {
    return buildTaskReadSummary(task);
  }

  dbWriteSummary(task: ProcessTaskExecutionRecord) {
    return buildTaskDbWriteSummary(task);
  }

  outputEntries(task: ProcessTaskExecutionRecord): Array<[string, unknown]> {
    return taskOutputEntries(task.payloadJson);
  }

  failure(task: ProcessTaskExecutionRecord) {
    return task.status === 'FAILED' ? summarizeFailure(task.details) : null;
  }

  downloadSkipped(task: ProcessTaskExecutionRecord): void {
    const summary = buildTaskReadSummary(task);
    if (!summary?.skippedRows.length) {
      return;
    }
    downloadSkippedRowsCsv(this.i18n, summary.skippedRows, `task-execution-${task.id}-skipped-rows.csv`);
  }

  formatDate(value: string | null): string {
    return formatExecutionDate(this.dateTime, value);
  }

  statusLabel(status: string): string {
    return resolveVocabulary(this.i18n, 'executionStatus', status);
  }

  taskTypeLabel(taskType: string): string {
    return resolveVocabulary(this.i18n, 'taskType', taskType);
  }

  formatOutput(value: unknown): string {
    return formatTaskOutputValue(value);
  }
}
