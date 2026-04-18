import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
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
import { ProcessTaskExecutionRecord } from '../../models/execution.models';

@Component({
  selector: 'ih-execution-task-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatExpansionModule],
    templateUrl: './execution-task-list.component.html',
    styleUrl: './execution-task-list.component.css'
})
export class ExecutionTaskListComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);

  readonly tasks = input.required<readonly ProcessTaskExecutionRecord[]>();
  readonly selectedTaskId = input<number | null>(null);
  readonly selectTask = output<number>();

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
    downloadSkippedRowsCsv(summary.skippedRows, `task-execution-${task.id}-skipped-rows.csv`);
  }

  formatDate(value: string | null): string {
    return formatExecutionDate(this.dateTime, value);
  }

  statusLabel(status: string): string {
    return this.i18n.t(`executionStatus.${status}`);
  }

  formatOutput(value: unknown): string {
    return formatTaskOutputValue(value);
  }
}
