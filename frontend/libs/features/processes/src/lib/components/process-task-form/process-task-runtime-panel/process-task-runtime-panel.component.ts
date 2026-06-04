import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  ProcessTaskExecutionMode,
  ProcessTaskInputDraft,
  ProcessTaskRuntimeDraft,
} from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskBindingContextService } from '../../../forms/process-task-binding-context.service';
import { ProcessTaskFormModel } from '../../../models/process.models';

/**
 * Panel de runtime por tarea: selecciona `executionMode`, tarea/output de origen y
 * `batchSize` del motor dinamico de inputs/outputs. Ver ADR-004.
 *
 * @trace RF-006, RF-009, RF-010
 */
@Component({
  selector: 'ih-process-task-runtime-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './process-task-runtime-panel.component.html',
  styleUrl: './process-task-runtime-panel.component.css',
})
export class ProcessTaskRuntimePanelComponent {
  readonly i18n = inject(I18nService);
  private readonly bindingContext = inject(ProcessTaskBindingContextService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly draft = input.required<ProcessTaskRuntimeDraft>();
  readonly readonly = input(false);
  readonly showInput = input(true);
  readonly runtimeChange = output<Partial<ProcessTaskRuntimeDraft>>();

  readonly taskOptions = computed(() => this.bindingContext.previousTaskOptions(this.task(), this.tasks()));
  readonly selectedInput = computed(() => this.draft().input ?? this.bindingContext.configuredInput(this.task(), this.tasks()));
  readonly showBatchSize = computed(() => this.draft().executionMode === 'batch' && !this.bindingContext.isFileInput(this.selectedInput(), this.tasks()));

  updateExecutionMode(executionMode: ProcessTaskExecutionMode): void {
    const input = this.sanitizeInput(this.selectedInput());
    this.runtimeChange.emit(input ? { executionMode, input } : { executionMode });
  }

  updateSourceTask(sourceTaskRef: string): void {
    const sourceTask = this.bindingContext.resolveTaskByRef(sourceTaskRef, this.tasks());
    this.runtimeChange.emit({
      input: this.sanitizeInput(this.withCurrentBatchSize({
        source: 'task-output',
        sourceTaskRef,
        sourceOutput: this.bindingContext.defaultOutputForTask(sourceTask),
      })),
    });
  }

  updateBatchSize(batchSize: string): void {
    const current = this.selectedInput();
    if (!current?.sourceTaskRef) {
      return;
    }
    this.runtimeChange.emit({
      input: {
        ...current,
        source: 'task-output',
        batchSize,
      },
    });
  }

  private withCurrentBatchSize(input: ProcessTaskInputDraft): ProcessTaskInputDraft {
    const currentBatchSize = this.selectedInput()?.batchSize;
    return currentBatchSize ? { ...input, batchSize: currentBatchSize } : input;
  }

  private sanitizeInput(input: ProcessTaskInputDraft | undefined): ProcessTaskInputDraft | undefined {
    if (!input) {
      return undefined;
    }
    if (!this.bindingContext.isFileInput(input, this.tasks())) {
      return input;
    }
    const { batchSize: _batchSize, ...next } = input;
    return next;
  }
}
