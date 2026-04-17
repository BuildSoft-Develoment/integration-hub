import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ConnectionRef, ProcessTaskFormModel, ProcessTaskType, ReaderRef, SourceRef } from '../../process.models';
import { ProcessTaskFormHostComponent } from '../process-task-form/process-task-form-host/process-task-form-host.component';

@Component({
  selector: 'ih-process-task-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    ProcessTaskFormHostComponent,
  ],
    templateUrl: './process-task-modal.component.html',
    styleUrl: './process-task-modal.component.css'
})
export class ProcessTaskModalComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly index = input(0);
  readonly sources = input.required<readonly SourceRef[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly connections = input.required<readonly ConnectionRef[]>();
  readonly readonly = input(false);

  readonly patchTask = output<Partial<ProcessTaskFormModel>>();
  readonly close = output<void>();

  taskTypeLabel(taskType: ProcessTaskType): string {
    return this.manager.label(taskType);
  }

  usesWorkspaceLayout(): boolean {
    return this.task().taskType === 'DB_WRITE'
      || this.task().taskType === 'DB_EXECUTE_SP'
      || this.task().taskType === 'DB_EXECUTE_FN'
      || this.task().taskType === 'REST_CALL';
  }

  isRestTask(): boolean {
    return this.task().taskType === 'REST_CALL';
  }
}
