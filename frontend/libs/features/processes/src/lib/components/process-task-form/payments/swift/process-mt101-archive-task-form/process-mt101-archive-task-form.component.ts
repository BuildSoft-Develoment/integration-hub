// @trace spec 008-mensajeria-pagos RF-003, RF-014, T-011
// @trace ADR-009
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  Mt101ArchiveHashAlgorithm,
  Mt101ArchiveTaskDraft,
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ConnectionRef, ProcessTaskFormModel } from '../../../../../models/process.models';
import { ProcessTaskRuntimePanelComponent } from '../../../shared/process-task-runtime-panel/process-task-runtime-panel.component';
import { ConnectionSelectComponent } from '../../../shared/connection-select/connection-select.component';
import { TaskFormShellComponent } from '../../../shared/task-form-shell/task-form-shell.component';

@Component({
  selector: 'ih-process-mt101-archive-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule, ProcessTaskRuntimePanelComponent, ConnectionSelectComponent, TaskFormShellComponent],
  templateUrl: './process-mt101-archive-task-form.component.html',
  styleUrl: './process-mt101-archive-task-form.component.css',
})
export class ProcessMt101ArchiveTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly connections = input.required<readonly ConnectionRef[]>();
  readonly readonly = input(false);

  readonly draft = computed<Mt101ArchiveTaskDraft>(
    () => this.manager.draftFor<Mt101ArchiveTaskDraft>(this.task()),
  );

  readonly hashAlgorithms: ReadonlyArray<Mt101ArchiveHashAlgorithm> = ['SHA-256', 'SHA-512'];

  updateDraft(patch: Partial<Mt101ArchiveTaskDraft>): void {
    const next: Mt101ArchiveTaskDraft = { ...this.draft(), ...patch };
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, next));
  }
}
