import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskExecutionRecord } from '../../execution.models';

@Component({
  selector: 'ih-execution-task-list',
  standalone: true,
  imports: [CommonModule, MatExpansionModule],
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
          <mat-expansion-panel [expanded]="index === 0">
            <mat-expansion-panel-header>
              <mat-panel-title>{{ i18n.t('ui.task', { index: index + 1 }) }}</mat-panel-title>
              <mat-panel-description>{{ task.taskType }} | {{ i18n.t('executionStatus.' + task.status) }}</mat-panel-description>
            </mat-expansion-panel-header>

            <div class="task-card">
              <div class="task-details">
                <div><strong>{{ i18n.t('ui.taskType') }}</strong>: {{ task.taskType }}</div>
                <div><strong>{{ i18n.t('common.status') }}</strong>: {{ i18n.t('executionStatus.' + task.status) }}</div>
                <div><strong>{{ i18n.t('executions.executedAt') }}</strong>: {{ task.executedAt || '-' }}</div>
                <div><strong>{{ i18n.t('executions.startedAt') }}</strong>: {{ task.startedAt || '-' }}</div>
                <div><strong>{{ i18n.t('executions.finishedAt') }}</strong>: {{ task.finishedAt || '-' }}</div>
              </div>

              @if (task.details) {
                <div class="task-block">
                  <strong>{{ i18n.t('executions.details') }}</strong>
                  <pre>{{ task.details }}</pre>
                </div>
              }

              @if (task.payloadJson) {
                <div class="task-block">
                  <strong>{{ i18n.t('executions.payloadJson') }}</strong>
                  <pre>{{ task.payloadJson }}</pre>
                </div>
              }

              @if (task.processedFiles.length > 0) {
                <div class="task-block">
                  <strong>{{ i18n.t('executions.processedFiles') }}</strong>
                  <ul>
                    @for (file of task.processedFiles; track file.id) {
                      <li>{{ file.fileName || file.filePath || '-' }} - {{ file.status || '-' }}</li>
                    }
                  </ul>
                </div>
              }
            </div>
          </mat-expansion-panel>
        }
      </mat-accordion>
    </section>
  `,
  styles: [`
      .task-shell { display: grid; gap: 0.9rem; }
      .task-shell__header { display: flex; gap: 1rem; align-items: end; justify-content: space-between; }
      .section-eyebrow { margin: 0; font-size: 0.74rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ih-text-soft); }
      h4 { margin: 0.28rem 0 0; font-size: 1rem; }
      .task-accordion { display: grid; gap: 0.5rem; }
      .task-card { display: grid; gap: 0.9rem; padding-top: 0.25rem; }
      .task-details { display: grid; gap: 0.4rem; }
      .task-block { display: grid; gap: 0.5rem; }
      pre { margin: 0; padding: 0.85rem; border-radius: 14px; overflow: auto; background: color-mix(in srgb, var(--ih-surface) 92%, #0f172a 8%); }
      ul { margin: 0; padding-left: 1rem; }
    `],
})
export class ExecutionTaskListComponent {
  readonly i18n = inject(I18nService);
  readonly tasks = input.required<readonly ProcessTaskExecutionRecord[]>();
}
