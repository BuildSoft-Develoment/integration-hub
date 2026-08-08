// @trace ADR-016 (procesos: formulario de la tarea FILE_DELIVER)
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { FileDeliverTaskDraft, ProcessTaskFormBridgeService } from '@integration-hub/core/providers';
import { ProcessTaskFormModel, SourceRef } from '../../../../models/process.models';
import { ProcessTaskRuntimePanelComponent } from '@integration-hub/shared/process-form-kit';
import { TaskFormShellComponent } from '@integration-hub/shared/process-form-kit';

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
    TaskFormShellComponent,
  ],
  templateUrl: './process-file-deliver-task-form.component.html',
  // shared css = clases de contenido (task-grid/full-width); css propio (2do, gana) solo pasa el :host al
  // modelo del shell (altura fija; la .tfs-body scrollea) sin tocar el shared de FILE_WRITE/FILE_COMPRESS.
  styleUrls: ['../file-task-form.shared.css', './process-file-deliver-task-form.component.css'],
})
export class ProcessFileDeliverTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly sources = input<readonly SourceRef[]>([]);
  readonly readonly = input(false);
  // ADR-016: once-task -> el selector de modo de ejecucion se restringe a 'once' (toTaskPatch igual lo fuerza).
  readonly executionModes = ['once'] as const;

  readonly draft = computed<FileDeliverTaskDraft>(() => this.manager.draftFor<FileDeliverTaskDraft>(this.task()));

  // El destino (sinkRef) debe ser una fuente activa con direction OUTPUT/BOTH (un sink). El backend lo valida
  // igual, pero el picker ya ofrece solo candidatos validos para no dejar elegir una fuente de solo lectura.
  readonly sinkOptions = computed(() =>
    this.sources().filter((source) => source.active !== false && this.isSink(source.direction)),
  );

  private isSink(direction?: string): boolean {
    const normalized = (direction ?? 'INPUT').toUpperCase();
    return normalized === 'OUTPUT' || normalized === 'BOTH';
  }

  // Mismo desajuste que en el form de MT101_PAY: el draft declara sinkRef como string (se hidrata con
  // String(...) desde configuration_json) y las opciones emiten el id NUMERICO de la fuente. Sin comparador
  // propio mat-select usa ===, "8" !== 8, y el destino elegido se pinta vacio al recomputarse el draft.
  readonly sameSink = (a: unknown, b: unknown): boolean => this.sinkRefOf(a) === this.sinkRefOf(b);

  sinkRefOf(value: unknown): string {
    return value == null ? '' : String(value);
  }

  updateDraft(patch: Partial<FileDeliverTaskDraft>): void {
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, { ...this.draft(), ...patch }));
  }
}
