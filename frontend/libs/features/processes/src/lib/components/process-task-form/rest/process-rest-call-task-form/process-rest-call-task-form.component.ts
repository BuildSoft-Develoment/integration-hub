import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { HttpRequestDraft, ProcessTaskFormBridgeService, RestCallTaskDraft } from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskFormModel, ReaderRef } from '../../../../models/process.models';
import { ProcessHttpRequestComponent } from '../../shared/process-http-request/process-http-request.component';
import { ProcessTaskRuntimePanelComponent } from '../../shared/process-task-runtime-panel/process-task-runtime-panel.component';
import { TaskFormShellComponent } from '../../shared/task-form-shell/task-form-shell.component';

@Component({
  selector: 'ih-process-rest-call-task-form',
  standalone: true,
  imports: [CommonModule, ProcessHttpRequestComponent, ProcessTaskRuntimePanelComponent, TaskFormShellComponent],
    templateUrl: './process-rest-call-task-form.component.html',
    styleUrl: './process-rest-call-task-form.component.css'
})
export class ProcessRestCallTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  // M-1b: outputs viajan al host via bridge.
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly readonly = input(false);

  readonly draft = computed<RestCallTaskDraft>(() => this.manager.draftFor<RestCallTaskDraft>(this.task()));

  updateDraft(patch: Partial<RestCallTaskDraft> | Partial<HttpRequestDraft>): void {
    const next = { ...this.draft(), ...patch } as RestCallTaskDraft;
    next.mode = next.executionMode;
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, next));
  }
}
