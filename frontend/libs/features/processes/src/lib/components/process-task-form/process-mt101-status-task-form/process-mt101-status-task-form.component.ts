// @trace spec 008-mensajeria-pagos RF-005, T-021
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import {
  Mt101StatusMode,
  Mt101StatusTaskDraft,
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ConnectionRef, ProcessTaskFormModel } from '../../../models/process.models';
import { ProcessTaskRuntimePanelComponent } from '../process-task-runtime-panel/process-task-runtime-panel.component';
import { ConnectionSelectComponent } from '../connection-select/connection-select.component';
import { TaskFormShellComponent } from '../task-form-shell/task-form-shell.component';

@Component({
  selector: 'ih-process-mt101-status-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    ProcessTaskRuntimePanelComponent,
    ConnectionSelectComponent,
    TaskFormShellComponent,
  ],
  templateUrl: './process-mt101-status-task-form.component.html',
  styleUrl: './process-mt101-status-task-form.component.css',
})
export class ProcessMt101StatusTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly connections = input.required<readonly ConnectionRef[]>();
  readonly readonly = input(false);

  readonly draft = computed<Mt101StatusTaskDraft>(
    () => this.manager.hydrateDraft<Mt101StatusTaskDraft>(this.task()) ?? this.defaultDraft(),
  );

  readonly modes: ReadonlyArray<Mt101StatusMode> = ['query', 'poll', 'callback'];
  readonly httpMethods: ReadonlyArray<string> = ['GET', 'POST'];

  updateDraft(patch: Partial<Mt101StatusTaskDraft>): void {
    const next: Mt101StatusTaskDraft = { ...this.draft(), ...patch };
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, next));
  }

  private defaultDraft(): Mt101StatusTaskDraft {
    return {
      taskRef: this.task().clientId,
      executionMode: 'per-record',
      mode: 'query',
      queryUrl: '',
      queryMethod: 'GET',
      queryTimeoutSeconds: 30,
      statusField: '$.status',
      referenceField: '$.gatewayReference',
      errorMessageField: '$.error.message',
      connectionRef: '',
      confirmationTable: 'mt101_confirmation',
    };
  }
}
