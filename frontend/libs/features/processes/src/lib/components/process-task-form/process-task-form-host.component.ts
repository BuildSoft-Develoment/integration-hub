import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ConnectionRef, ProcessTaskFormModel, ReaderRef, SourceRef } from '../../process.models';
import { ProcessDbExecuteFnTaskFormComponent } from './process-db-execute-fn-task-form.component';
import { ProcessDbExecuteSpTaskFormComponent } from './process-db-execute-sp-task-form.component';
import { ProcessDbWriteTaskFormComponent } from './process-db-write-task-form.component';
import { ProcessFileReadTaskFormComponent } from './process-file-read-task-form.component';
import { ProcessJsonTaskFormComponent } from './process-json-task-form.component';
import { ProcessNotificationTaskFormComponent } from './process-notification-task-form.component';
import { ProcessRestCallTaskFormComponent } from './process-rest-call-task-form.component';

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
  template: `
    <div class="task-form-shell" [class.task-form-shell--workspace]="usesWorkspaceLayout()">
      @if (task().taskType === 'FILE_READ') {
        <ih-process-file-read-task-form
          [task]="task()"
          [sources]="sources()"
          [readers]="readers()"
          [readonly]="readonly()"
          (patchTask)="patchTask.emit($event)"
        />
      } @else if (task().taskType === 'DB_WRITE') {
        <ih-process-db-write-task-form
          [task]="task()"
          [tasks]="tasks()"
          [readers]="readers()"
          [connections]="connections()"
          [readonly]="readonly()"
          (patchTask)="patchTask.emit($event)"
        />
      } @else if (task().taskType === 'DB_EXECUTE_SP') {
        <ih-process-db-execute-sp-task-form
          [task]="task()"
          [tasks]="tasks()"
          [readers]="readers()"
          [connections]="connections()"
          [readonly]="readonly()"
          (patchTask)="patchTask.emit($event)"
        />
      } @else if (task().taskType === 'DB_EXECUTE_FN') {
        <ih-process-db-execute-fn-task-form
          [task]="task()"
          [tasks]="tasks()"
          [readers]="readers()"
          [connections]="connections()"
          [readonly]="readonly()"
          (patchTask)="patchTask.emit($event)"
        />
      } @else if (task().taskType === 'REST_CALL') {
        <ih-process-rest-call-task-form
          [task]="task()"
          [tasks]="tasks()"
          [readers]="readers()"
          [readonly]="readonly()"
          (patchTask)="patchTask.emit($event)"
        />
      } @else if (task().taskType === 'NOTIFICATION') {
        <ih-process-notification-task-form
          [task]="task()"
          [readonly]="readonly()"
          (patchTask)="patchTask.emit($event)"
        />
      } @else {
        <ih-process-json-task-form
          [task]="task()"
          [connections]="connections()"
          [readonly]="readonly()"
          (patchTask)="patchTask.emit($event)"
        />
      }
    </div>
  `,
  styles: [`
      :host {
        display: block;
        min-width: 0;
      }
      :host.task-form-host--workspace {
        min-height: 0;
        height: 100%;
      }
      .task-form-shell {
        display: grid;
        gap: 1rem;
        min-width: 0;
      }
      .task-form-shell > * {
        min-width: 0;
        max-width: 100%;
      }
      .task-form-shell--workspace {
        min-height: 0;
        height: 100%;
      }
    `],
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
