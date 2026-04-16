import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';

import { I18nService } from '@integration-hub/core/services';

import { formatTriggerSourceLabel } from '../../execution-detail.utils';
import { ProcessExecutionRecord } from '../../execution.models';

@Component({
  selector: 'ih-execution-editor-header',
  standalone: true,
  imports: [CommonModule],
  template: `
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
          @if (childrenCount()) {
            <span class="profile-badge">{{ i18n.t('executions.childExecutions') }} {{ childrenCount() }}</span>
          }
          @if (failedTaskType()) {
            <span class="profile-badge profile-badge--danger">{{ i18n.t('executions.failedAtTask') }} {{ failedTaskType() }}</span>
          }
        </div>
      </div>
    }
  `,
  styles: [`
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
  `],
})
export class ExecutionEditorHeaderComponent {
  readonly i18n = inject(I18nService);

  readonly execution = input<ProcessExecutionRecord | null>(null);
  readonly childrenCount = input(0);
  readonly failedTaskType = input<string | null>(null);

  statusLabel(status: string): string {
    return this.i18n.t(`executionStatus.${status}`);
  }

  triggerLabel(value: string | null): string {
    return formatTriggerSourceLabel(value);
  }
}
