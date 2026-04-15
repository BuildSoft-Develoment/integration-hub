import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { DateTimeService, I18nService } from '@integration-hub/core/services';
import {
  buildTaskReadSummary,
  downloadSkippedRowsCsv,
  formatTaskOutputValue,
  summarizeFailure,
  taskOutputEntries,
} from '../../execution-detail.utils';
import { ProcessTaskExecutionRecord } from '../../execution.models';

@Component({
  selector: 'ih-execution-task-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatExpansionModule],
  template: `
    <section class="task-shell">
      <div class="task-shell__header">
        <div>
          <p class="section-eyebrow">{{ i18n.t('ui.tasks', { count: tasks().length }) }}</p>
          <h4>{{ i18n.t('executions.tasksTitle') }}</h4>
        </div>
      </div>

      <mat-accordion class="task-accordion">
        @for (task of tasks(); track task.id; let index = $index) {
          <mat-expansion-panel [expanded]="selectedTaskId() === task.id" (opened)="selectTask.emit(task.id)">
            <mat-expansion-panel-header>
              <mat-panel-title>
                {{ i18n.t('ui.task', { index: index + 1 }) }}
              </mat-panel-title>
              <mat-panel-description>
                {{ task.taskType }} | {{ statusLabel(task.status) }}
              </mat-panel-description>
            </mat-expansion-panel-header>

            <div class="task-card">
              <div class="task-details">
                <div><strong>{{ i18n.t('ui.taskType') }}</strong>: {{ task.taskType }}</div>
                <div><strong>{{ i18n.t('common.status') }}</strong>: {{ statusLabel(task.status) }}</div>
                <div><strong>{{ i18n.t('executions.executedAt') }}</strong>: {{ formatDate(task.executedAt) }}</div>
                <div><strong>{{ i18n.t('executions.startedAt') }}</strong>: {{ formatDate(task.startedAt) }}</div>
                <div><strong>{{ i18n.t('executions.finishedAt') }}</strong>: {{ formatDate(task.finishedAt) }}</div>
              </div>

              @if (failure(task)) {
                <section class="task-card__surface task-card__surface--error">
                  <strong>{{ failure(task)!.title }}</strong>
                  <p>{{ failure(task)!.summary }}</p>
                </section>
              }

              @if (readSummary(task)) {
                <section class="task-card__surface">
                  <div class="task-summary-metrics">
                    <span class="summary-pill summary-pill--success">Validos: {{ readSummary(task)!.validCount ?? '-' }}</span>
                    <span class="summary-pill summary-pill--warning">Omitidos: {{ readSummary(task)!.skippedCount ?? '-' }}</span>
                    @if (readSummary(task)!.writtenCount != null) {
                      <span class="summary-pill summary-pill--info">Escritos: {{ readSummary(task)!.writtenCount }}</span>
                    }
                    <span class="summary-pill">Archivos: {{ readSummary(task)!.files.length || readSummary(task)!.completedFilesCount || 0 }}</span>
                    @if (readSummary(task)!.failedFiles.length) {
                      <span class="summary-pill summary-pill--danger">Fallidos: {{ readSummary(task)!.failedFiles.length }}</span>
                    }
                  </div>
                  <p class="task-summary-text">{{ readSummary(task)!.summary }}</p>

                  @if (readSummary(task)!.files.length) {
                    <div class="task-list-block">
                      <strong>Resumen por archivo</strong>
                      <ul>
                        @for (file of readSummary(task)!.files; track file.fileName + '-' + $index) {
                          <li>
                            <strong>{{ file.fileName || '-' }}</strong>:
                            validos={{ file.recordCount ?? '-' }},
                            omitidos={{ file.skippedCount ?? '-' }}
                            @if (file.writtenCount != null) {
                              , escritos={{ file.writtenCount }}
                            }
                          </li>
                        }
                      </ul>
                    </div>
                  }

                  @if (readSummary(task)!.failedFiles.length) {
                    <div class="task-list-block">
                      <strong>Archivos fallidos ({{ readSummary(task)!.failedFiles.length }})</strong>
                      <ul>
                        @for (file of readSummary(task)!.failedFiles; track file.fileName + '-' + $index) {
                          <li>
                            <strong>{{ file.fileName || '-' }}</strong>: {{ file.message || '-' }}
                          </li>
                        }
                      </ul>
                    </div>
                  }

                  @if (readSummary(task)!.skippedRows.length) {
                    <div class="task-list-actions">
                      <button mat-stroked-button type="button" (click)="downloadSkipped(task)">
                        {{ i18n.t('executions.downloadSkippedRows') }}
                      </button>
                    </div>
                    <div class="task-list-block">
                      <strong>{{ i18n.t('executions.skippedRows') }}</strong>
                      <ul>
                        @for (row of readSummary(task)!.skippedRows; track (row.rowNumber || 0) + '-' + row.reason) {
                          <li>row {{ row.rowNumber ?? '-' }}: {{ row.reason }}</li>
                        }
                      </ul>
                    </div>
                  }
                </section>
              }

              @if (task.payloadJson) {
                <div class="task-block">
                  <strong>{{ i18n.t('executions.payloadJson') }}</strong>
                  <pre>{{ task.payloadJson }}</pre>
                </div>
              }

              @if (outputEntries(task).length) {
                <div class="task-block">
                  <strong>{{ i18n.t('executions.taskOutputs') }}</strong>
                  <ul>
                    @for (entry of outputEntries(task); track entry[0]) {
                      <li><strong>{{ entry[0] }}</strong>: {{ formatOutput(entry[1]) }}</li>
                    }
                  </ul>
                </div>
              }

              @if (task.details) {
                <div class="task-block">
                  <strong>{{ i18n.t('executions.details') }}</strong>
                  <pre>{{ task.details }}</pre>
                </div>
              }
            </div>
          </mat-expansion-panel>
        }
      </mat-accordion>
    </section>
  `,
  styles: [`
    .task-shell { display:grid; gap:0.9rem; }
    .task-shell__header { display:flex; gap:1rem; align-items:end; justify-content:space-between; }
    .section-eyebrow { margin:0; font-size:0.74rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--ih-text-soft); }
    h4 { margin:0.28rem 0 0; font-size:1rem; }
    .task-accordion { display:grid; gap:0.5rem; }
    .task-card { display:grid; gap:0.9rem; padding-top:0.25rem; }
    .task-details { display:grid; gap:0.45rem; }
    .task-card__surface { display:grid; gap:0.75rem; padding:0.9rem; border:1px solid var(--ih-border); border-radius:16px; background:color-mix(in srgb, var(--ih-surface-alt) 92%, transparent); }
    .task-card__surface--error { border-color:color-mix(in srgb, var(--ih-error) 45%, var(--ih-border)); background:color-mix(in srgb, var(--ih-error) 8%, var(--ih-surface-alt)); }
    .task-card__surface p, .task-summary-text { margin:0; line-height:1.5; }
    .task-summary-metrics { display:flex; flex-wrap:wrap; gap:0.55rem; }
    .summary-pill { display:inline-flex; align-items:center; justify-content:center; padding:0.32rem 0.68rem; border-radius:999px; background:color-mix(in srgb, var(--ih-surface) 88%, transparent); font-size:0.77rem; font-weight:700; }
    .summary-pill--success { background:color-mix(in srgb, #16a34a 12%, transparent); color:#166534; }
    .summary-pill--warning { background:color-mix(in srgb, #f59e0b 18%, transparent); color:#9a6700; }
    .summary-pill--info { background:color-mix(in srgb, #2563eb 14%, transparent); color:#1d4ed8; }
    .summary-pill--danger { background:color-mix(in srgb, #dc2626 14%, transparent); color:#991b1b; }
    .task-list-actions { display:flex; justify-content:flex-start; }
    .task-list-block { display:grid; gap:0.45rem; }
    .task-block { display:grid; gap:0.5rem; }
    pre { margin:0; padding:0.85rem; border-radius:14px; overflow:auto; background:color-mix(in srgb, var(--ih-surface) 92%, #0f172a 8%); }
    ul { margin:0; padding-left:1rem; }
  `],
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
    return value ? this.dateTime.formatIso(value) : '-';
  }

  statusLabel(status: string): string {
    return this.i18n.t(`executionStatus.${status}`);
  }

  formatOutput(value: unknown): string {
    return formatTaskOutputValue(value);
  }
}
