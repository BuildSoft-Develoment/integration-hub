// @trace ADR-016 (procesos: formulario de la tarea FILE_COMPRESS)
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { FileCompressTaskDraft, ProcessTaskFormBridgeService } from '@integration-hub/core/providers';
import { ProcessTaskFormModel } from '../../../../models/process.models';
import { ProcessTaskRuntimePanelComponent } from '../../shared/process-task-runtime-panel/process-task-runtime-panel.component';
import { TaskFormShellComponent } from '../../shared/task-form-shell/task-form-shell.component';

@Component({
  selector: 'ih-process-file-compress-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    ProcessTaskRuntimePanelComponent,
    TaskFormShellComponent,
  ],
  templateUrl: './process-file-compress-task-form.component.html',
  // shared css = clases de contenido (task-grid/toggle-wrap); css propio (2do, gana) solo pasa el :host al
  // modelo del shell (altura fija; la .tfs-body scrollea) sin tocar el shared de FILE_WRITE/FILE_DELIVER.
  styleUrls: ['../file-task-form.shared.css', './process-file-compress-task-form.component.css'],
})
export class ProcessFileCompressTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly readonly = input(false);
  // ADR-016: once-task -> el selector de modo de ejecucion se restringe a 'once' (toTaskPatch igual lo fuerza).
  readonly executionModes = ['once'] as const;

  readonly draft = computed<FileCompressTaskDraft>(() => this.manager.draftFor<FileCompressTaskDraft>(this.task()));

  updateDraft(patch: Partial<FileCompressTaskDraft>): void {
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, { ...this.draft(), ...patch }));
  }
}
