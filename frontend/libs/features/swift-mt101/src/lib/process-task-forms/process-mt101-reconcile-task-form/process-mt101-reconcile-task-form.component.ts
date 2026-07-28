// @trace spec 008-mensajeria-pagos RF-006, T-021
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import {
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import {
  Mt101ReconcileTaskDraft,
} from '../../process-tasks';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ConnectionRef, ProcessTaskFormModel } from '@integration-hub/core/providers';
import { ProcessTaskRuntimePanelComponent } from '@integration-hub/shared/process-form-kit';
import { ConnectionSelectComponent } from '@integration-hub/shared/process-form-kit';
import { TaskFormShellComponent } from '@integration-hub/shared/process-form-kit';

@Component({
  selector: 'ih-process-mt101-reconcile-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    ProcessTaskRuntimePanelComponent,
    ConnectionSelectComponent,
    TaskFormShellComponent,
  ],
  templateUrl: './process-mt101-reconcile-task-form.component.html',
  styleUrl: './process-mt101-reconcile-task-form.component.css',
})
export class ProcessMt101ReconcileTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly connections = input.required<readonly ConnectionRef[]>();
  readonly readonly = input(false);

  readonly draft = computed<Mt101ReconcileTaskDraft>(
    () => this.manager.draftFor<Mt101ReconcileTaskDraft>(this.task()),
  );

  updateDraft(patch: Partial<Mt101ReconcileTaskDraft>): void {
    const next: Mt101ReconcileTaskDraft = { ...this.draft(), ...patch };
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, next));
  }
}
