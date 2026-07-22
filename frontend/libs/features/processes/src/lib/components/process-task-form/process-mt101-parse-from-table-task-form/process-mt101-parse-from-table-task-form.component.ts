import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Mt101ParseFromTableTaskDraft, ProcessTaskFormBridgeService } from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ConnectionRef, ProcessTaskFormModel } from '../../../models/process.models';
import { ProcessTaskRuntimePanelComponent } from '../process-task-runtime-panel/process-task-runtime-panel.component';
import { TaskFormShellComponent } from '../task-form-shell/task-form-shell.component';
import { ConnectionSelectComponent } from '../connection-select/connection-select.component';

/**
 * Form propio de MT101_PARSE_FROM_TABLE (ya no reusa el de MT101_PARSE). Expone lo que el backend table-backed
 * lee: pageSize + replaceExisting + inboundSetIdTemplate + overrides de la tabla staging (table/connectionRef/
 * columnas). La tarea de origen (el DB_WRITE que stageo) se elige en el runtime-panel; los overrides en blanco
 * los deriva el backend de esa tarea.
 */
@Component({
  selector: 'ih-process-mt101-parse-from-table-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    ProcessTaskRuntimePanelComponent,
    TaskFormShellComponent,
    ConnectionSelectComponent,
  ],
  templateUrl: './process-mt101-parse-from-table-task-form.component.html',
  styleUrl: './process-mt101-parse-from-table-task-form.component.css',
})
export class ProcessMt101ParseFromTableTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  // El host pasa `connections` a todos los forms; se usa en el picker de la conexion (override) de la fuente.
  readonly connections = input<readonly ConnectionRef[]>([]);
  readonly readonly = input(false);

  readonly draft = computed<Mt101ParseFromTableTaskDraft>(
    () => this.manager.hydrateDraft<Mt101ParseFromTableTaskDraft>(this.task()) ?? this.defaultDraft(),
  );

  updateDraft(patch: Partial<Mt101ParseFromTableTaskDraft>): void {
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, { ...this.draft(), ...patch }));
  }

  updateSource(patch: Partial<Mt101ParseFromTableTaskDraft['source']>): void {
    this.updateDraft({ source: { ...this.draft().source, ...patch } });
  }

  private defaultDraft(): Mt101ParseFromTableTaskDraft {
    return {
      taskRef: this.task().clientId,
      executionMode: 'once',
      pageSize: 500,
      replaceExisting: true,
      inboundSetIdTemplate: 'INB-${_processExecutionId}-${_taskDefinitionId}',
      source: { table: '', connectionRef: '', payloadColumn: 'payload_json', idColumn: 'id' },
    };
  }
}
