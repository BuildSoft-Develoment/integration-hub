// @trace spec 008-mensajeria-pagos RF-002, T-011
// @trace ADR-009
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import {
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import {
  Mt101ValidateSeverity,
  Mt101ValidateStandard,
  Mt101ValidateTaskDraft,
} from '../../process-tasks';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ConnectionRef, ProcessTaskFormModel } from '@integration-hub/core/providers';
import { ProcessTaskRuntimePanelComponent } from '@integration-hub/shared/process-form-kit';
import { ConnectionSelectComponent } from '@integration-hub/shared/process-form-kit';
import { TaskFormShellComponent } from '@integration-hub/shared/process-form-kit';

@Component({
  selector: 'ih-process-mt101-validate-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTabsModule, ProcessTaskRuntimePanelComponent, ConnectionSelectComponent, TaskFormShellComponent],
  templateUrl: './process-mt101-validate-task-form.component.html',
  styleUrl: './process-mt101-validate-task-form.component.css',
})
export class ProcessMt101ValidateTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  // M-1b: outputs viajan al host via bridge.
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly connections = input.required<readonly ConnectionRef[]>();
  readonly readonly = input(false);

  readonly draft = computed<Mt101ValidateTaskDraft>(
    () => this.manager.draftFor<Mt101ValidateTaskDraft>(this.task()),
  );

  readonly standards: ReadonlyArray<Mt101ValidateStandard> = ['SWIFT', 'ISO20022', 'OPENBANKING', '*'];
  readonly severities: ReadonlyArray<Mt101ValidateSeverity> = ['ERROR', 'WARNING', 'INFO'];
  readonly calendars: ReadonlyArray<string> = ['PE', 'EU', 'US', '*'];

  updateDraft(patch: Partial<Mt101ValidateTaskDraft>): void {
    const next: Mt101ValidateTaskDraft = { ...this.draft(), ...patch };
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, next));
  }
}
