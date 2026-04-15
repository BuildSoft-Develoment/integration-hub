import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@integration-hub/core/services';
import { ProcessExecutionRecord, ProcessTaskExecutionRecord } from '../../execution.models';
import { ExecutionTaskListComponent } from '../execution-task-list/execution-task-list.component';

@Component({
  selector: 'ih-execution-editor',
  standalone: true,
  imports: [CommonModule, MatButtonModule, ExecutionTaskListComponent],
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
                <p class="profile-subtitle">#{{ execution()!.id }} · {{ i18n.t('executionStatus.' + execution()!.status) }}</p>
              </div>
            </div>
          </div>

          <section class="form-section">
            <div class="section-header">
              <p class="section-eyebrow">{{ i18n.t('ui.overview') }}</p>
              <h4>{{ i18n.t('executions.detail') }}</h4>
            </div>
            <div class="detail-grid">
              <div><strong>{{ i18n.t('executions.processDefinitionId') }}</strong>: {{ execution()!.processDefinitionId }}</div>
              <div><strong>{{ i18n.t('common.status') }}</strong>: {{ i18n.t('executionStatus.' + execution()!.status) }}</div>
              <div><strong>{{ i18n.t('executions.triggerSource') }}</strong>: {{ execution()!.triggerSource || '-' }}</div>
              <div><strong>{{ i18n.t('executions.sourceExecutionId') }}</strong>: {{ execution()!.sourceExecutionId ?? '-' }}</div>
              <div><strong>{{ i18n.t('executions.startedAt') }}</strong>: {{ execution()!.startedAt || '-' }}</div>
              <div><strong>{{ i18n.t('executions.finishedAt') }}</strong>: {{ execution()!.finishedAt || '-' }}</div>
            </div>
            @if (execution()!.details) {
              <div class="detail-block">
                <strong>{{ i18n.t('executions.details') }}</strong>
                <pre>{{ execution()!.details }}</pre>
              </div>
            }
          </section>

          <section class="form-section">
            <ih-execution-task-list [tasks]="tasks()" />
          </section>
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
      .section-eyebrow { margin: 0; font-size: 0.74rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ih-text-soft); }
      .profile-name { margin: 0; font-size: 1.45rem; font-weight: 700; letter-spacing: -0.03em; overflow-wrap: anywhere; }
      .profile-subtitle { margin: 0; color: var(--ih-text-soft); overflow-wrap: anywhere; }
      .form-section { display: grid; gap: 0.9rem; padding: 0.95rem; border: 1px solid var(--ih-border); border-radius: 18px; background: color-mix(in srgb, var(--ih-surface-alt) 93%, transparent); min-width: 0; margin-bottom: 0.9rem; }
      .section-header h4 { margin: 0.28rem 0 0; font-size: 1rem; overflow-wrap: anywhere; }
      .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.7rem; }
      .detail-block { display: grid; gap: 0.5rem; }
      pre { margin: 0; padding: 0.85rem; border-radius: 14px; overflow: auto; background: color-mix(in srgb, var(--ih-surface) 92%, #0f172a 8%); }
      .empty-state { min-height: 20rem; display: grid; place-items: center; text-align: center; }
      @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
    `],
})
export class ExecutionEditorComponent {
  readonly i18n = inject(I18nService);
  readonly execution = input<ProcessExecutionRecord | null>(null);
  readonly tasks = input<readonly ProcessTaskExecutionRecord[]>([]);
  readonly loading = input(false);
  readonly close = output<void>();
}
