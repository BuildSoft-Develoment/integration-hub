import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';

import { I18nService } from '@integration-hub/core/services';
import { IconComponent } from '@integration-hub/shared/ui';

import { formatTriggerSourceLabel } from '../../../details/execution-detail.utils';
import { ProcessExecutionRecord } from '../../../models/execution.models';

@Component({
  selector: 'ih-execution-editor-header',
  standalone: true,
  imports: [CommonModule, IconComponent],
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
    templateUrl: './execution-editor-header.component.html'
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
