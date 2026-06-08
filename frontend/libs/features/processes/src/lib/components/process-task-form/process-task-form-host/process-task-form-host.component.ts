// @trace spec 003-diseno-y-ejecucion-procesos T-016 (M-1b puro: registry como unico path)
// @trace spec 008-mensajeria-pagos T-011
// @trace ADR-009
import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, untracked } from '@angular/core';
import {
  PROCESS_TASK_FORM_REGISTRY,
  ProcessTaskFormBridgeService,
  ProcessTaskFormRegistration,
} from '@integration-hub/core/providers';
import { ConnectionRef, ProcessTaskFormModel, ReaderRef, SourceRef } from '../../../models/process.models';

/**
 * Host del formulario de configuracion de tarea.
 *
 * <p><b>M-1b puro</b>: el unico camino es el {@link PROCESS_TASK_FORM_REGISTRY}.
 * Todas las verticales (motor incluido) registran sus formularios via DI; el host
 * los instancia con {@code ngComponentOutlet} y suscribe sus patches via
 * {@link ProcessTaskFormBridgeService}.</p>
 *
 * <p>Sin switch legacy: cada {@code ProcessTaskType} usado en runtime debe tener una
 * registracion previa. Si falta, el host muestra una notificacion explicita en vez
 * de un fallback silencioso (regla "fail fast" en config).</p>
 */
@Component({
  selector: 'ih-process-task-form-host',
  standalone: true,
  host: {
    '[class.task-form-host--workspace]': 'usesWorkspaceLayout()',
  },
  imports: [CommonModule],
  providers: [ProcessTaskFormBridgeService],
  templateUrl: './process-task-form-host.component.html',
  styleUrl: './process-task-form-host.component.css',
})
export class ProcessTaskFormHostComponent {
  /** Registro de formularios aportados por features (motor + verticales). */
  private readonly registry = inject(PROCESS_TASK_FORM_REGISTRY, { optional: true }) ?? [];
  /** Puente signal-based que recoge patches del componente dinamico. */
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  // --- Inputs / Outputs signal-based ---
  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly sources = input.required<readonly SourceRef[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly connections = input.required<readonly ConnectionRef[]>();
  readonly readonly = input(false);

  readonly patchTask = output<Partial<ProcessTaskFormModel>>();

  // --- Estado derivado (todo computed) ---

  /** Registracion encontrada para el {@code taskType} actual, o {@code null}. */
  readonly registered = computed<ProcessTaskFormRegistration | null>(
    () => this.registry.find((r) => r.type === this.task().taskType) ?? null,
  );

  /** Inputs a pasar al componente registrado via {@code ngComponentOutlet}. */
  readonly registeredInputs = computed(() => ({
    task: this.task(),
    tasks: this.tasks(),
    sources: this.sources(),
    readers: this.readers(),
    connections: this.connections(),
    readonly: this.readonly(),
  }));

  /** Marca verdadero cuando un formulario registrado maneja la tarea actual. */
  readonly isRegistered = computed(() => this.registered() !== null);

  /** Layout workspace declarado por la propia registracion. */
  readonly usesWorkspaceLayout = computed<boolean>(() => this.registered()?.layout === 'workspace');

  constructor() {
    // Reenvia los patches del puente como output propio del host. {@code untracked}
    // evita que el effect se autoinvalide por leer otras signals dentro del emit.
    effect(() => {
      const event = this.bridge.lastPatch();
      if (event && event.id > 0) {
        untracked(() => this.patchTask.emit(event.patch));
      }
    });
  }
}
