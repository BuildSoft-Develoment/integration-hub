import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';

import {
  ExecutionFileActionRequest,
  ExecutionNavigationEntry,
  ProcessExecutionRecord,
  ProcessTaskExecutionRecord,
} from '../../execution.models';
import { ExecutionLineageComponent } from '../execution-lineage/execution-lineage.component';
import { ExecutionTaskListComponent } from '../execution-task-list/execution-task-list.component';
import { ExecutionEditorFilesTabComponent } from './execution-editor-files-tab.component';
import { ExecutionEditorHeaderComponent } from './execution-editor-header.component';
import { ExecutionEditorStore } from './execution-editor.store';
import { ExecutionEditorSummaryComponent } from './execution-editor-summary.component';
import { I18nService } from '@integration-hub/core/services';

@Component({
  selector: 'ih-execution-editor',
  standalone: true,
  providers: [ExecutionEditorStore],
  imports: [
    CommonModule,
    MatButtonModule,
    MatTabsModule,
    ExecutionTaskListComponent,
    ExecutionLineageComponent,
    ExecutionEditorHeaderComponent,
    ExecutionEditorSummaryComponent,
    ExecutionEditorFilesTabComponent,
  ],
  template: `
    <section class="panel-card ih-drawer-editor">
      <div class="panel-body ih-drawer-editor__body">
        <div class="panel-topbar">
          <button mat-stroked-button type="button" (click)="close.emit()">{{ i18n.t('common.close') }}</button>
        </div>

        @if (execution()) {
          <ih-execution-editor-header
            [execution]="execution()"
            [childrenCount]="children().length"
            [failedTaskType]="store.failedTask()?.taskType ?? null"
          />

          <mat-tab-group animationDuration="0ms" class="execution-tabs">
            <mat-tab [label]="i18n.t('executions.summaryTab')">
              <ih-execution-editor-summary
                [execution]="execution()"
                [selectedTask]="store.selectedTask()"
                [selectedTaskSummary]="store.selectedTaskSummary()"
                [failedExecutionSummary]="store.failedExecutionSummary()"
              />
            </mat-tab>

            <mat-tab [label]="i18n.t('executions.tasksTab')">
              <div class="tab-body">
                <section class="form-section">
                  <ih-execution-task-list
                    [tasks]="tasks()"
                    [selectedTaskId]="store.selectedTaskId()"
                    (selectTask)="store.selectTask($event)"
                  />
                </section>
              </div>
            </mat-tab>

            <mat-tab [label]="i18n.t('executions.filesTab')">
              <ih-execution-editor-files-tab
                [execution]="execution()"
                [tasks]="tasks()"
                [actionBusy]="actionBusy()"
                (fileAction)="fileAction.emit($event)"
              />
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
      .execution-tabs { min-width: 0; }
      .tab-body { display: grid; gap: 1rem; padding-top: 1rem; }
      .form-section { display: grid; gap: 0.9rem; padding: 0.95rem; border: 1px solid var(--ih-border); border-radius: 18px; background: color-mix(in srgb, var(--ih-surface-alt) 93%, transparent); min-width: 0; }
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
  readonly store = inject(ExecutionEditorStore);

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

  constructor() {
    effect(() => {
      this.store.syncContext(this.execution(), this.tasks());
    });
  }
}
