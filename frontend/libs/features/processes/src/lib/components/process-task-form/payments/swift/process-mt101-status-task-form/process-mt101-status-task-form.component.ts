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
  ProcessTaskExecutionMode,
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ConnectionRef, ProcessTaskFormModel } from '../../../../../models/process.models';
import { ProcessTaskRuntimePanelComponent } from '../../../shared/process-task-runtime-panel/process-task-runtime-panel.component';
import { ConnectionSelectComponent } from '../../../shared/connection-select/connection-select.component';
import { TaskFormShellComponent } from '../../../shared/task-form-shell/task-form-shell.component';

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
    () => this.manager.draftFor<Mt101StatusTaskDraft>(this.task()),
  );

  readonly modes: ReadonlyArray<Mt101StatusMode> = ['query', 'poll', 'callback'];
  readonly httpMethods: ReadonlyArray<string> = ['GET', 'POST'];

  /**
   * G1: restriccion POR CAMINO, no por tarea. 'poll' y 'callback' SUSPENDEN la tarea, y el motor descarta el flag
   * 'suspended' fuera de 'once' (cerraria COMPLETADA sin esperar al banco), asi que el backend los rechaza
   * fail-loud (Mt101StatusTaskProvider.guardOnceExecutionMode). El camino 'query' simple —una consulta HTTP por
   * mensaje, el uso normal de STATUS y el motivo de su default 'per-record'— si soporta los tres modos.
   */
  readonly executionModes = computed<readonly ProcessTaskExecutionMode[]>(() =>
    this.draft().mode === 'query' ? ['once', 'per-record', 'batch'] : ['once'],
  );

  /**
   * Al pasar a un modo que suspende se fuerza executionMode 'once' en el mismo patch: dejar un 'per-record'
   * guardado haria que el backend rechazara la tarea recien en ejecucion.
   */
  updateMode(mode: Mt101StatusMode): void {
    this.updateDraft(mode === 'query' ? { mode } : { mode, executionMode: 'once' });
  }

  updateDraft(patch: Partial<Mt101StatusTaskDraft>): void {
    const next: Mt101StatusTaskDraft = { ...this.draft(), ...patch };
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, next));
  }
}
