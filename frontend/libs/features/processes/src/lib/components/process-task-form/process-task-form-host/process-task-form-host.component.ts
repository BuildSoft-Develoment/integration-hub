import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ConnectionRef, ProcessTaskFormModel, ReaderRef, SourceRef } from '../../../models/process.models';
import { ProcessDbExecuteFnTaskFormComponent } from '../process-db-execute-fn-task-form/process-db-execute-fn-task-form.component';
import { ProcessDbExecuteSpTaskFormComponent } from '../process-db-execute-sp-task-form/process-db-execute-sp-task-form.component';
import { ProcessDbWriteTaskFormComponent } from '../process-db-write-task-form/process-db-write-task-form.component';
import { ProcessFileReadTaskFormComponent } from '../process-file-read-task-form/process-file-read-task-form.component';
import { ProcessJsonTaskFormComponent } from '../process-json-task-form/process-json-task-form.component';
import { ProcessNotificationTaskFormComponent } from '../process-notification-task-form/process-notification-task-form.component';
import { ProcessRestCallTaskFormComponent } from '../process-rest-call-task-form/process-rest-call-task-form.component';

@Component({
  selector: 'ih-process-task-form-host',
  standalone: true,
  host: {
    '[class.task-form-host--workspace]': 'usesWorkspaceLayout()',
  },
  imports: [
    CommonModule,
    ProcessFileReadTaskFormComponent,
    ProcessDbWriteTaskFormComponent,
    ProcessDbExecuteSpTaskFormComponent,
    ProcessDbExecuteFnTaskFormComponent,
    ProcessRestCallTaskFormComponent,
    ProcessNotificationTaskFormComponent,
    ProcessJsonTaskFormComponent,
  ],
    templateUrl: './process-task-form-host.component.html',
    styleUrl: './process-task-form-host.component.css'
})
export class ProcessTaskFormHostComponent {
  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly sources = input.required<readonly SourceRef[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly connections = input.required<readonly ConnectionRef[]>();
  readonly readonly = input(false);

  readonly patchTask = output<Partial<ProcessTaskFormModel>>();

  usesWorkspaceLayout(): boolean {
    return this.task().taskType === 'DB_WRITE'
      || this.task().taskType === 'DB_EXECUTE_SP'
      || this.task().taskType === 'DB_EXECUTE_FN'
      || this.task().taskType === 'REST_CALL';
  }
}
