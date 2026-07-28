import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { ProcessTaskBindingContextService } from '../../services/process-task-binding-context.service';
import { AsyncOffloadSupport, AsyncState, MessagingTransportsService } from '../../services/messaging-transports.service';
import { ProcessTaskFormModel } from '@integration-hub/core/providers';
import { AsyncDispatchSectionComponent } from '../async-dispatch-section/async-dispatch-section.component';
import { TaskContinueOnFailureComponent } from '../task-continue-on-failure/task-continue-on-failure.component';

/**
 * Panel de runtime por tarea: selecciona `executionMode`, tarea/output de origen y
 * `batchSize` del motor dinamico de inputs/outputs. Ver ADR-004.
 *
 * @trace RF-006, RF-009, RF-010
 */
@Component({
  selector: 'ih-process-task-runtime-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    AsyncDispatchSectionComponent,
    TaskContinueOnFailureComponent,
  ],
  templateUrl: './process-task-runtime-panel.component.html',
  styleUrl: './process-task-runtime-panel.component.css',
})
export class ProcessTaskRuntimePanelComponent {
  readonly i18n = inject(I18nService);
  private readonly bindingContext = inject(ProcessTaskBindingContextService);
  private readonly transportsApi = inject(MessagingTransportsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly draft = input.required<ProcessTaskRuntimeDraft>();
  readonly readonly = input(false);
  readonly showInput = input(true);
  // FILE_WRITE: permite "Ninguna" tarea de origen (sin tarea = leer una tabla directa). No auto-deriva un origen
  // (no fallback a configuredInput) para respetar el estado vacio. Otras tareas (DB_WRITE/SP/FN) NO lo activan.
  readonly allowClearInput = input(false);
  readonly executionModes = input<readonly ProcessTaskExecutionMode[]>(['once', 'per-record', 'batch']);
  readonly runtimeChange = output<Partial<ProcessTaskRuntimeDraft>>();

  /** Transportes disponibles para el selector async (fallback ['KAFKA'] ante error/403). */
  readonly transports = signal<readonly string[]>(['KAFKA']);
  /**
   * Estado compuesto del despacho async del entorno (#4): READY/DEGRADED/DISABLED. Alimenta el aviso de la sección
   * (advisory). Default READY (permisivo): ante error de lectura no se alarma — el guard del backend es la barrera real.
   */
  readonly asyncState = signal<AsyncState>('READY');
  /** Capacidad de offload async por tipo de tarea (del catálogo backend). */
  private readonly asyncCapabilities = signal<Record<string, AsyncOffloadSupport>>({});

  /**
   * Capacidad del tipo de la tarea actual. Mientras no cargue el catálogo (o el tipo no aparezca) se
   * asume `SUPPORTED` (permisivo): la UI no oculta el toggle por una lectura fallida — el guard del
   * backend es la barrera real. Cuando el catálogo dice `UNSUPPORTED`/`SLICE_ONLY`, la sección gatea.
   */
  readonly asyncOffloadSupport = computed<AsyncOffloadSupport>(
    () => this.asyncCapabilities()[String(this.task().taskType ?? '').toUpperCase()] ?? 'SUPPORTED'
  );

  constructor() {
    this.transportsApi
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          if (list?.length) {
            this.transports.set(list);
          }
        },
        error: () => {
          /* fallback ['KAFKA'] */
        },
      });
    this.transportsApi
      .asyncStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // Consume el estado compuesto; fallback al flag legacy si `state` no viniera (backend viejo).
        next: (status) =>
          this.asyncState.set(status.state ?? (status.executionEnabled ? 'READY' : 'DISABLED')),
        error: () => {
          /* asume READY ante error para no alarmar de mas (el guard del backend es la barrera real) */
        },
      });
    this.transportsApi
      .asyncCapabilities()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (capabilities) => this.asyncCapabilities.set(capabilities),
        error: () => {
          /* asume SUPPORTED ante error: no gatea por una lectura fallida (el backend igual guarda) */
        },
      });
  }

  /** Al desactivar async se limpia también el transporte. */
  updateAsync(async: boolean): void {
    this.runtimeChange.emit(async ? { async: true } : { async: false, asyncTransport: undefined });
  }

  readonly taskOptions = computed(() => this.bindingContext.previousTaskOptions(this.task(), this.tasks()));
  // Con allowClearInput no se auto-deriva una tarea de origen: el selector refleja el estado real (vacio = "Ninguna").
  readonly selectedInput = computed(() =>
    this.draft().input ?? (this.allowClearInput() ? undefined : this.bindingContext.configuredInput(this.task(), this.tasks())),
  );
  readonly showBatchSize = computed(() => this.draft().executionMode === 'batch' && !this.bindingContext.isFileInput(this.selectedInput(), this.tasks()));

  /**
   * Etiqueta COMPLETA de la tarea origen, para el tooltip nativo del selector. El trigger la recorta con elipsis
   * cuando el taskRef + tipo es largo (p.ej. "task-10 - UN_TIPO_DE_TAREA_LARGO" no entra en el ancho del campo),
   * y sin title no habia forma de leerla sin desplegar la lista.
   */
  readonly selectedTaskLabel = computed(() => {
    const sourceTaskRef = this.selectedInput()?.sourceTaskRef ?? '';
    return this.taskOptions().find((option) => option.taskRef === sourceTaskRef)?.label ?? '';
  });

  updateExecutionMode(executionMode: ProcessTaskExecutionMode): void {
    const input = this.sanitizeInput(this.selectedInput());
    this.runtimeChange.emit(input ? { executionMode, input } : { executionMode });
  }

  executionModeLabel(executionMode: ProcessTaskExecutionMode): string {
    return this.i18n.t(`ui.executionMode.${executionMode === 'per-record' ? 'perRecord' : executionMode}`);
  }

  updateSourceTask(sourceTaskRef: string): void {
    if (!sourceTaskRef) {
      // "Ninguna" -> se limpia la tarea de origen (FILE_WRITE: pasa a leer una tabla directa).
      this.runtimeChange.emit({ input: undefined });
      return;
    }
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
