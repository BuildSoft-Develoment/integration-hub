import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { A11yModule } from '@angular/cdk/a11y';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ConnectionRef, ProcessTaskFormModel, ProcessTaskType, ReaderRef, SourceRef } from '../../models/process.models';
import { ProcessTaskFormHostComponent } from '../process-task-form/process-task-form-host/process-task-form-host.component';

@Component({
  selector: 'ih-process-task-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    A11yModule,
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

  @HostListener('keydown.escape')
  onEscape(): void {
    this.close.emit();
  }

  taskTypeLabel(taskType: ProcessTaskType): string {
    return this.manager.label(taskType);
  }

  modalLayout(): 'workspace' | 'rest' | undefined {
    return this.manager.modalLayout(this.task().taskType);
  }
}
