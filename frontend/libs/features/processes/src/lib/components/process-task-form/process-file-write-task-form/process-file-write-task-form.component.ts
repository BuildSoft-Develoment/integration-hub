// @trace ADR-016 (procesos: formulario de la tarea FILE_WRITE - layout header/detalle/trailer)
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import {
  FileWriteCellDraft,
  FileWriteColumnDraft,
  FileWriteSourceMode,
  FileWriteTableSourceDraft,
  FileWriteTaskDraft,
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import { COMMON_ENCODINGS, SuggestInputComponent } from '@integration-hub/shared/ui';
import { ConnectionRef, ProcessTaskFormModel } from '../../../models/process.models';
import { ProcessTaskRuntimePanelComponent } from '../process-task-runtime-panel/process-task-runtime-panel.component';

type CellSection = 'header' | 'trailer';

@Component({
  selector: 'ih-process-file-write-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    SuggestInputComponent,
    ProcessTaskRuntimePanelComponent,
  ],
  templateUrl: './process-file-write-task-form.component.html',
  styleUrl: '../file-task-form.shared.css',
})
export class ProcessFileWriteTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly connections = input<readonly ConnectionRef[]>([]);
  readonly readonly = input(false);

  readonly draft = computed<FileWriteTaskDraft>(() => this.manager.hydrateDraft<FileWriteTaskDraft>(this.task()) ?? {
    taskRef: this.task().clientId,
    executionMode: 'once',
    format: 'CSV',
    encoding: 'UTF-8',
    lineEnding: 'LF',
    delimiter: ',',
    columns: [],
    header: [],
    trailer: [],
    archiveNameTemplate: '',
    sourceMode: 'records',
    tableSource: { table: '', connectionRef: '', orderBy: 'id', payloadColumn: '', batchSize: '' },
  });

  // 008: sugerencias del combo de codificacion (editable), consistente con los readers.
  readonly encodings = COMMON_ENCODINGS;
  // ADR-016: FILE_WRITE es once-task -> el selector de modo de ejecucion se restringe a 'once' (evita ofrecer
  // batch/per-record, que toTaskPatch igual fuerza a 'once' y rebotarian).
  readonly executionModes = ['once'] as const;

  readonly isTxt = computed(() => this.draft().format === 'TXT');
  readonly isTableSource = computed(() => this.draft().sourceMode === 'table');

  setSourceMode(mode: FileWriteSourceMode): void {
    this.updateDraft({ sourceMode: mode });
  }

  updateTableSource(patch: Partial<FileWriteTableSourceDraft>): void {
    this.updateDraft({ tableSource: { ...this.draft().tableSource, ...patch } });
  }

  updateDraft(patch: Partial<FileWriteTaskDraft>): void {
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, { ...this.draft(), ...patch }));
  }

  // --- columnas de detalle ---
  addColumn(): void {
    this.updateDraft({ columns: [...this.draft().columns, { field: '' }] });
  }

  removeColumn(index: number): void {
    this.updateDraft({ columns: this.draft().columns.filter((_, i) => i !== index) });
  }

  updateColumn(index: number, patch: Partial<FileWriteColumnDraft>): void {
    this.updateDraft({ columns: this.draft().columns.map((column, i) => (i === index ? { ...column, ...patch } : column)) });
  }

  // --- celdas de cabecera / trailer ---
  cells(section: CellSection): FileWriteCellDraft[] {
    return section === 'header' ? this.draft().header : this.draft().trailer;
  }

  addCell(section: CellSection): void {
    this.setCells(section, [...this.cells(section), { kind: 'value', value: '' }]);
  }

  removeCell(section: CellSection, index: number): void {
    this.setCells(section, this.cells(section).filter((_, i) => i !== index));
  }

  updateCell(section: CellSection, index: number, patch: Partial<FileWriteCellDraft>): void {
    this.setCells(section, this.cells(section).map((cell, i) => (i === index ? { ...cell, ...patch } : cell)));
  }

  private setCells(section: CellSection, cells: FileWriteCellDraft[]): void {
    this.updateDraft(section === 'header' ? { header: cells } : { trailer: cells });
  }
}
