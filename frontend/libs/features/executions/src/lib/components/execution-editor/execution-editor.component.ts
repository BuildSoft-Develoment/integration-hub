import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { DateTimeService, I18nService } from '@integration-hub/core/services';
import {
  buildTaskReadSummary,
  formatTriggerSourceLabel,
  summarizeFailure,
} from '../../execution-detail.utils';
import {
  ExecutionFileActionRequest,
  ExecutionNavigationEntry,
  ProcessExecutionRecord,
  ProcessTaskExecutionRecord,
} from '../../execution.models';
import { ExecutionFilesPanelComponent } from '../execution-files-panel/execution-files-panel.component';
import { ExecutionLineageComponent } from '../execution-lineage/execution-lineage.component';
import { ExecutionTaskListComponent } from '../execution-task-list/execution-task-list.component';

@Component({
  selector: 'ih-execution-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatExpansionModule,
    MatTabsModule,
    ExecutionTaskListComponent,
    ExecutionFilesPanelComponent,
    ExecutionLineageComponent,
  ],
  template: `
    <section class="panel-card ih-drawer-editor">
      <div class="panel-body ih-drawer-editor__body">
        <div class="panel-topbar">
          <button mat-stroked-button type="button" (click)="close.emit()">{{ i18n.t('common.close') }}</button>
        </div>

        @if (execution()) {
          <div class="profile-stack">
            <div class="profile-header">
              <div class="profile-avatar">{{ execution()!.processName.slice(0, 1).toUpperCase() }}</div>
              <div class="profile-copy">
                <h3 class="profile-name">{{ execution()!.processName }}</h3>
                <p class="profile-subtitle">#{{ execution()!.id }} · {{ statusLabel(execution()!.status) }}</p>
              </div>
            </div>

            <div class="profile-badges">
              <span class="profile-badge">{{ triggerLabel(execution()!.triggerSource) }}</span>
              @if (execution()!.sourceExecutionId) {
                <span class="profile-badge profile-badge--accent">Origen #{{ execution()!.sourceExecutionId }}</span>
              }
              @if (children().length) {
                <span class="profile-badge">{{ i18n.t('executions.childExecutions') }} {{ children().length }}</span>
              }
              @if (failedTask()) {
                <span class="profile-badge profile-badge--danger">{{ i18n.t('executions.failedAtTask') }} {{ failedTask()!.taskType }}</span>
              }
            </div>
          </div>

          <mat-tab-group animationDuration="0ms" class="execution-tabs">
            <mat-tab [label]="i18n.t('executions.summaryTab')">
              <div class="tab-body">
                <section class="form-section">
                  <div class="section-header">
                    <p class="section-eyebrow">{{ i18n.t('ui.overview') }}</p>
                    <h4>{{ i18n.t('executions.detail') }}</h4>
                  </div>

                  <div class="detail-grid">
                    <div><strong>{{ i18n.t('executions.processDefinitionId') }}</strong>: {{ execution()!.processDefinitionId }}</div>
                    <div><strong>{{ i18n.t('common.status') }}</strong>: {{ statusLabel(execution()!.status) }}</div>
                    <div><strong>{{ i18n.t('executions.triggerSource') }}</strong>: {{ triggerLabel(execution()!.triggerSource) }}</div>
                    <div><strong>{{ i18n.t('executions.sourceExecutionId') }}</strong>: {{ execution()!.sourceExecutionId ?? '-' }}</div>
                    <div><strong>{{ i18n.t('executions.startedAt') }}</strong>: {{ formatDate(execution()!.startedAt) }}</div>
                    <div><strong>{{ i18n.t('executions.finishedAt') }}</strong>: {{ formatDate(execution()!.finishedAt) }}</div>
                  </div>
                </section>

                @if (failedExecutionSummary()) {
                  <section class="form-section form-section--error">
                    <div class="section-header">
                      <p class="section-eyebrow">{{ i18n.t('executions.failureSummary') }}</p>
                      <h4>{{ failedExecutionSummary()!.title }}</h4>
                    </div>
                    <p class="section-copy">{{ failedExecutionSummary()!.summary }}</p>
                  </section>
                }

                @if (selectedTaskSummary()) {
                  <section class="form-section">
                    <div class="section-header">
                      <p class="section-eyebrow">{{ i18n.t('executions.selectedTaskSummary') }}</p>
                      <h4>{{ selectedTask() ? selectedTask()!.taskType : i18n.t('executions.tasksTitle') }}</h4>
                    </div>

                    <div class="summary-metrics">
                      <span class="summary-pill summary-pill--success">Validos {{ selectedTaskSummary()!.validCount ?? '-' }}</span>
                      <span class="summary-pill summary-pill--warning">Omitidos {{ selectedTaskSummary()!.skippedCount ?? '-' }}</span>
                      @if (selectedTaskSummary()!.writtenCount != null) {
                        <span class="summary-pill summary-pill--info">Escritos {{ selectedTaskSummary()!.writtenCount }}</span>
                      }
                      <span class="summary-pill">Archivos {{ selectedTaskSummary()!.files.length || selectedTaskSummary()!.completedFilesCount || 0 }}</span>
                    </div>

                    <p class="section-copy">{{ selectedTaskSummary()!.summary }}</p>
                  </section>
                }

                @if (execution()!.details) {
                  <section class="form-section">
                    <div class="section-header">
                      <p class="section-eyebrow">{{ i18n.t('executions.details') }}</p>
                      <h4>{{ i18n.t('executions.details') }}</h4>
                    </div>
                    <pre>{{ execution()!.details }}</pre>
                  </section>
                }
              </div>
            </mat-tab>

            <mat-tab [label]="i18n.t('executions.tasksTab')">
              <div class="tab-body">
                <section class="form-section">
                  <ih-execution-task-list
                    [tasks]="tasks()"
                    [selectedTaskId]="selectedTaskId()"
                    (selectTask)="onSelectTask($event)"
                  />
                </section>
              </div>
            </mat-tab>

            <mat-tab [label]="i18n.t('executions.filesTab')">
              <div class="tab-body">
                @if (tasks().length) {
                  <section class="form-section">
                    <div class="section-header">
                      <p class="section-eyebrow">{{ i18n.t('executions.processedFiles') }}</p>
                      <h4>{{ i18n.t('executions.filesTab') }}</h4>
                    </div>

                    <mat-accordion class="files-tab-accordion">
                      @for (task of tasks(); track task.id; let index = $index) {
                        <mat-expansion-panel [expanded]="index === 0">
                          <mat-expansion-panel-header>
                            <mat-panel-title>
                              {{ task.taskType }}
                            </mat-panel-title>
                            <mat-panel-description>
                              #{{ task.id }} | {{ statusLabel(task.status) }} | {{ task.processedFiles.length }} archivos
                            </mat-panel-description>
                          </mat-expansion-panel-header>

                          <ih-execution-files-panel
                            [execution]="execution()"
                            [task]="task"
                            [actionBusy]="actionBusy()"
                            (fileAction)="fileAction.emit($event)"
                          />
                        </mat-expansion-panel>
                      }
                    </mat-accordion>
                  </section>
                } @else {
                  <section class="form-section">
                    <div class="empty-state ih-muted">{{ i18n.t('executions.taskDetailEmpty') }}</div>
                  </section>
                }
              </div>
            </mat-tab>

            <mat-tab [label]="i18n.t('executions.lineageTab')">
              <div class="tab-body">
                <section class="form-section">
                  <ih-execution-lineage
                    [execution]="execution()"
                    [children]="children()"
                    [navigationStack]="navigationStack()"
                    (openExecution)="openExecution.emit($event)"
                    (goBack)="goBack.emit()"
                  />
                </section>
              </div>
            </mat-tab>
          </mat-tab-group>
        } @else if (loading()) {
          <div class="empty-state ih-muted">{{ i18n.t('executions.loadingDetail') }}</div>
        } @else {
          <div class="empty-state ih-muted">{{ i18n.t('executions.emptySelection') }}</div>
        }
      </div>
    </section>
  `,
  styles: [`
      .panel-card { min-height: 100%; height: 100%; }
      .panel-body { min-height: 100%; display: grid; align-content: start; padding: 1rem; overflow: auto; }
      .panel-topbar { display: flex; justify-content: flex-end; margin-bottom: 0.65rem; }
      .profile-stack { display: grid; gap: 0.8rem; margin-bottom: 1rem; }
      .profile-header { display: flex; align-items: center; gap: 1rem; min-width: 0; }
      .profile-avatar { display: grid; place-items: center; width: 4rem; height: 4rem; border-radius: 22px; background: color-mix(in srgb, var(--ih-accent) 14%, transparent); color: var(--ih-accent-strong); font-size: 1.2rem; font-weight: 800; }
      .profile-copy { display: grid; gap: 0.28rem; min-width: 0; }
      .profile-name { margin: 0; font-size: 1.45rem; font-weight: 700; letter-spacing: -0.03em; overflow-wrap: anywhere; }
      .profile-subtitle { margin: 0; color: var(--ih-text-soft); overflow-wrap: anywhere; }
      .profile-badges { display: flex; flex-wrap: wrap; gap: 0.55rem; }
      .profile-badge { display: inline-flex; align-items: center; justify-content: center; padding: 0.32rem 0.68rem; border-radius: 999px; background: color-mix(in srgb, var(--ih-surface) 88%, transparent); font-size: 0.77rem; font-weight: 700; }
      .profile-badge--accent { background: color-mix(in srgb, var(--ih-accent) 12%, transparent); color: var(--ih-accent-strong); }
      .profile-badge--danger { background: color-mix(in srgb, #dc2626 14%, transparent); color: #991b1b; }
      .execution-tabs { min-width: 0; }
      .tab-body { display: grid; gap: 1rem; padding-top: 1rem; }
      .form-section { display: grid; gap: 0.9rem; padding: 0.95rem; border: 1px solid var(--ih-border); border-radius: 18px; background: color-mix(in srgb, var(--ih-surface-alt) 93%, transparent); min-width: 0; }
      .form-section--error { border-color: color-mix(in srgb, var(--ih-error) 45%, var(--ih-border)); background: color-mix(in srgb, var(--ih-error) 8%, var(--ih-surface-alt)); }
      .files-tab-accordion { display: grid; gap: 0.65rem; }
      .section-header h4 { margin: 0.28rem 0 0; font-size: 1rem; overflow-wrap: anywhere; }
      .section-eyebrow { margin: 0; font-size: 0.74rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ih-text-soft); }
      .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.7rem; }
      .summary-metrics { display: flex; flex-wrap: wrap; gap: 0.55rem; }
      .summary-pill { display: inline-flex; align-items: center; justify-content: center; padding: 0.32rem 0.68rem; border-radius: 999px; background: color-mix(in srgb, var(--ih-surface) 88%, transparent); font-size: 0.77rem; font-weight: 700; }
      .summary-pill--success { background: color-mix(in srgb, #16a34a 12%, transparent); color: #166534; }
      .summary-pill--warning { background: color-mix(in srgb, #f59e0b 18%, transparent); color: #9a6700; }
      .summary-pill--info { background: color-mix(in srgb, #2563eb 14%, transparent); color: #1d4ed8; }
      .section-copy { margin: 0; line-height: 1.55; }
      pre { margin: 0; padding: 0.85rem; border-radius: 14px; overflow: auto; background: color-mix(in srgb, var(--ih-surface) 92%, #0f172a 8%); }
      .empty-state { min-height: 20rem; display: grid; place-items: center; text-align: center; }
      @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
    `],
})
export class ExecutionEditorComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);

  readonly execution = input<ProcessExecutionRecord | null>(null);
  readonly tasks = input<readonly ProcessTaskExecutionRecord[]>([]);
  readonly children = input<readonly ProcessExecutionRecord[]>([]);
  readonly navigationStack = input<readonly ExecutionNavigationEntry[]>([]);
  readonly loading = input(false);
  readonly actionBusy = input(false);
  readonly close = output<void>();
  readonly openExecution = output<number>();
  readonly goBack = output<void>();
  readonly fileAction = output<ExecutionFileActionRequest>();

  readonly selectedTaskId = signal<number | null>(null);

  readonly selectedTask = computed(
    () => this.tasks().find((task) => task.id === this.selectedTaskId()) ?? this.tasks()[0] ?? null
  );
  readonly selectedTaskSummary = computed(() => buildTaskReadSummary(this.selectedTask()));
  readonly failedTask = computed(() => this.tasks().find((task) => task.status === 'FAILED') ?? null);
  readonly failedExecutionSummary = computed(() => summarizeFailure(this.failedTask()?.details || this.execution()?.details));

  constructor() {
    effect(() => {
      const tasks = this.tasks();
      const selectedId = this.selectedTaskId();
      if (tasks.some((task) => task.id === selectedId)) {
        return;
      }

      const preferred = tasks.find((task) => task.status === 'FAILED') ?? tasks[0] ?? null;
      this.selectedTaskId.set(preferred?.id ?? null);
    });
  }

  statusLabel(status: string): string {
    return this.i18n.t(`executionStatus.${status}`);
  }

  formatDate(value: string | null): string {
    return value ? this.dateTime.formatIso(value) : '-';
  }

  triggerLabel(value: string | null): string {
    return formatTriggerSourceLabel(value);
  }

  onSelectTask(taskId: number): void {
    this.selectedTaskId.set(taskId);
  }
}
