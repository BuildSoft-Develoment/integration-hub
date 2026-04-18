import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';

import { I18nService } from '@integration-hub/core/services';

import {
  ExecutionFileActionRequest,
  ProcessExecutionRecord,
  ProcessTaskExecutionRecord,
} from '../../../models/execution.models';
import { ExecutionFilesPanelComponent } from '../../execution-files-panel/execution-files-panel.component';

@Component({
  selector: 'ih-execution-editor-files-tab',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, ExecutionFilesPanelComponent],
  styles: [`
    .tab-body { display: grid; gap: 1rem; padding-top: 1rem; }
    .form-section { display: grid; gap: 0.9rem; padding: 0.95rem; border: 1px solid var(--ih-border); border-radius: 18px; background: color-mix(in srgb, var(--ih-surface-alt) 93%, transparent); min-width: 0; }
    .files-tab-accordion { display: grid; gap: 0.65rem; }
    .section-header h4 { margin: 0.28rem 0 0; font-size: 1rem; overflow-wrap: anywhere; }
    .section-eyebrow { margin: 0; font-size: 0.74rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ih-text-soft); }
    .empty-state { min-height: 20rem; display: grid; place-items: center; text-align: center; }
  `],
    templateUrl: './execution-editor-files-tab.component.html'
})
export class ExecutionEditorFilesTabComponent {
  readonly i18n = inject(I18nService);

  readonly execution = input<ProcessExecutionRecord | null>(null);
  readonly tasks = input<readonly ProcessTaskExecutionRecord[]>([]);
  readonly actionBusy = input(false);
  readonly fileAction = output<ExecutionFileActionRequest>();

  statusLabel(status: string): string {
    return this.i18n.t(`executionStatus.${status}`);
  }
}
