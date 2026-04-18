import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';

import { DateTimeService, I18nService } from '@integration-hub/core/services';

import { formatTriggerSourceLabel } from '../../../details/execution-detail.utils';
import {
  ProcessExecutionRecord,
  ProcessTaskExecutionRecord,
  TaskFailureSummary,
  TaskReadSummary,
} from '../../../models/execution.models';

@Component({
  selector: 'ih-execution-editor-summary',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .tab-body { display: grid; gap: 1rem; padding-top: 1rem; }
    .form-section { display: grid; gap: 0.9rem; padding: 0.95rem; border: 1px solid var(--ih-border); border-radius: 18px; background: color-mix(in srgb, var(--ih-surface-alt) 93%, transparent); min-width: 0; }
    .form-section--error { border-color: color-mix(in srgb, var(--ih-error) 45%, var(--ih-border)); background: color-mix(in srgb, var(--ih-error) 8%, var(--ih-surface-alt)); }
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
    @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
  `],
    templateUrl: './execution-editor-summary.component.html'
})
export class ExecutionEditorSummaryComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);

  readonly execution = input<ProcessExecutionRecord | null>(null);
  readonly selectedTask = input<ProcessTaskExecutionRecord | null>(null);
  readonly selectedTaskSummary = input<TaskReadSummary | null>(null);
  readonly failedExecutionSummary = input<TaskFailureSummary | null>(null);

  statusLabel(status: string): string {
    return this.i18n.t(`executionStatus.${status}`);
  }

  formatDate(value: string | null): string {
    return value ? this.dateTime.formatIso(value) : '-';
  }

  triggerLabel(value: string | null): string {
    return formatTriggerSourceLabel(value);
  }
}
