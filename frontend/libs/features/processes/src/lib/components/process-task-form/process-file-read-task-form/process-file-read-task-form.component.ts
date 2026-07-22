import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskFormModel, ReaderRef, SourceRef } from '../../../models/process.models';
import { FileReadTaskDraft, ProcessTaskFormBridgeService, ReaderFieldDraft, ReaderProviderType } from '@integration-hub/core/providers';
import { ProcessTaskManagerService, ReaderManagerService } from '@integration-hub/core/services';
import { ProcessTaskBindingContextService } from '../../../forms/process-task-binding-context.service';
import { ProcessReaderFieldsViewComponent } from '../process-reader-fields-view/process-reader-fields-view.component';
import { ProcessTaskRuntimePanelComponent } from '../process-task-runtime-panel/process-task-runtime-panel.component';
import { TaskFormShellComponent } from '../task-form-shell/task-form-shell.component';

@Component({
  selector: 'ih-process-file-read-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule, ProcessReaderFieldsViewComponent, ProcessTaskRuntimePanelComponent, TaskFormShellComponent],
    templateUrl: './process-file-read-task-form.component.html',
    styleUrl: './process-file-read-task-form.component.css'
})
export class ProcessFileReadTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly readerManager = inject(ReaderManagerService);
  private readonly bindingContext = inject(ProcessTaskBindingContextService);
  // M-1b: outputs viajan al host via bridge (no via @Output()).
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  // El host pasa `tasks` a todos los forms via ngComponentOutlet; FILE_READ lo declara para alimentar el
  // runtime-panel (aunque con showInput=false no se usa el picker de tarea de origen).
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly sources = input.required<readonly SourceRef[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly readonly = input(false);
  // FILE_READ es un lector batch (entry task); el selector de modo del panel queda fijo en 'batch'.
  readonly executionModes = ['batch'] as const;

  readonly draft = computed<FileReadTaskDraft>(() => this.manager.hydrateDraft<FileReadTaskDraft>(this.task()) ?? {
    taskRef: this.task().clientId,
    executionMode: 'batch',
    sourceDefinitionId: null,
    readerDefinitionId: null,
    sourceVariablesText: '',
    batchSize: '500',
    parallel: false,
    parallelMode: 'file',
    maxConcurrency: null,
  });
  readonly selectedReader = computed(() => this.readers().find((item) => item.id === this.draft().readerDefinitionId) ?? null);
  // Definicion de campos (read-only) del reader elegido: se hidrata su config a ReaderDraft y se toma la
  // variante segun el modo (fixed-length -> range/fixedFields; delimitado -> position/fields). El mismo
  // origen que downstream ve como `records` del FILE_READ, mostrado aca para no tener que abrir el reader.
  readonly readerFields = computed<{ fields: readonly ReaderFieldDraft[]; variant: 'position' | 'range' }>(() => {
    const reader = this.selectedReader();
    if (!reader?.readerType) {
      return { fields: [], variant: 'position' };
    }
    const draft = this.readerManager.hydrateDraft(reader.readerType as ReaderProviderType, reader.configurationJson ?? '{}');
    const fixed = draft.mode === 'fixed-length';
    return { fields: (fixed ? draft.fixedFields : draft.fields) ?? [], variant: fixed ? 'range' : 'position' };
  });
  readonly selectedSource = computed(() => this.sources().find((item) => item.id === this.draft().sourceDefinitionId) ?? null);
  readonly compatibleReaderTypes = computed(() => this.bindingContext.inferCompatibleReaders(this.selectedSource()));
  // 010: en el picker de la tarea FILE_READ solo aparecen readers ACTIVOS y COMPATIBLES con la fuente
  // seleccionada. Se mantiene siempre el reader ya seleccionado (aunque quede inactivo/incompatible) para
  // no perder la seleccion al editar una tarea existente.
  readonly filteredReaders = computed(() => {
    const compatible = this.compatibleReaderTypes();
    const selectedId = this.draft().readerDefinitionId;
    return this.readers().filter((reader) => {
      if (reader.id === selectedId) {
        return true;
      }
      if (reader.active === false) {
        return false;
      }
      return !compatible.length || (!!reader.readerType && compatible.includes(reader.readerType as any));
    });
  });
  // 010: el picker de fuente tampoco muestra las inactivas (salvo la ya seleccionada).
  readonly filteredSources = computed(() => {
    const selectedId = this.draft().sourceDefinitionId;
    return this.sources().filter((source) => source.active !== false || source.id === selectedId);
  });
  readonly selectedSourceHint = computed(() => this.bindingContext.sourceCompatibilityHint(this.selectedSource()));
  readonly showReaderWarning = computed(() => {
    const reader = this.readers().find((item) => item.id === this.draft().readerDefinitionId);
    const compatible = this.compatibleReaderTypes();
    return !!reader?.readerType && compatible.length > 0 && !compatible.includes(reader.readerType as any);
  });

  updateDraft(patch: Partial<FileReadTaskDraft>): void {
    const nextDraft = { ...this.draft(), ...patch };
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, nextDraft));
  }
}

