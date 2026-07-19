// @trace ADR-016 (procesos: formulario de la tarea FILE_DELIVER)
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { FileDeliverTaskDraft, ProcessTaskFormBridgeService } from '@integration-hub/core/providers';
import { ProcessTaskFormModel, SourceRef } from '../../../models/process.models';
import { ProcessTaskRuntimePanelComponent } from '../process-task-runtime-panel/process-task-runtime-panel.component';

@Component({
  selector: 'ih-process-file-deliver-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ProcessTaskRuntimePanelComponent,
  ],
  templateUrl: './process-file-deliver-task-form.component.html',
})
export class ProcessFileDeliverTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly sources = input<readonly SourceRef[]>([]);
  readonly readonly = input(false);

  readonly draft = computed<FileDeliverTaskDraft>(() => this.manager.hydrateDraft<FileDeliverTaskDraft>(this.task()) ?? {
    taskRef: this.task().clientId,
    executionMode: 'once',
    sinkRef: '',
    dropPathTemplate: '${originalName}',
  });

  // Solo fuentes activas: el destino (sinkRef) debe ser una fuente con direction OUTPUT/BOTH; el backend lo valida.
  readonly sinkOptions = computed(() => this.sources().filter((source) => source.active !== false));

  updateDraft(patch: Partial<FileDeliverTaskDraft>): void {
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, { ...this.draft(), ...patch }));
  }
}
