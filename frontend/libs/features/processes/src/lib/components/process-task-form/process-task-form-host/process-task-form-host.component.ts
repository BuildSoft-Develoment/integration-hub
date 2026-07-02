// @trace spec 003-diseno-y-ejecucion-procesos T-016 (M-1b puro: registry como unico path)
// @trace spec 008-mensajeria-pagos T-011
// @trace ADR-009
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  PROCESS_TASK_FORM_REGISTRY,
  ProcessTaskFormBridgeService,
  ProcessTaskFormRegistration,
} from '@integration-hub/core/providers';
import { SchemaFormComponent, SchemaFormSchema, SchemaFormValue } from '@integration-hub/shared/ui';
import { PluginConfigSchemaService } from '../../../api/plugin-config-schema.service';
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
  imports: [CommonModule, SchemaFormComponent],
  providers: [ProcessTaskFormBridgeService],
  templateUrl: './process-task-form-host.component.html',
  styleUrl: './process-task-form-host.component.css',
})
export class ProcessTaskFormHostComponent {
  /** Registro de formularios aportados por features (motor + verticales). */
  private readonly registry = inject(PROCESS_TASK_FORM_REGISTRY, { optional: true }) ?? [];
  /** Puente signal-based que recoge patches del componente dinamico. */
  private readonly bridge = inject(ProcessTaskFormBridgeService);
  private readonly configSchemas = inject(PluginConfigSchemaService);
  private readonly destroyRef = inject(DestroyRef);

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

  // --- Camino schema-driven para tipos de plugin (sin form registrado) ---
  // No es un fallback legacy: es el unico camino para un tipo aportado por un plugin backend
  // que declara su config-schema pero no trae editor frontend propio. Los tipos built-in usan
  // su form registrado; los tipos sin schema mantienen el "fail fast" explicito.
  private readonly schemaState = signal<'loading' | 'none' | SchemaFormSchema>('none');

  /** Schema de config si el tipo (no registrado) declara uno con campos. */
  readonly schema = computed<SchemaFormSchema | null>(() => {
    const state = this.schemaState();
    return typeof state === 'object' ? state : null;
  });

  /** Valor inicial del schema-form desde el {@code configurationJson} de la tarea. */
  readonly schemaValue = computed<SchemaFormValue>(() => {
    try {
      const parsed = JSON.parse(this.task().configurationJson || '{}');
      return parsed && typeof parsed === 'object' ? (parsed as SchemaFormValue) : {};
    } catch {
      return {};
    }
  });

  constructor() {
    // Reenvia los patches del puente como output propio del host. {@code untracked}
    // evita que el effect se autoinvalide por leer otras signals dentro del emit.
    effect(() => {
      const event = this.bridge.lastPatch();
      if (event && event.id > 0) {
        untracked(() => this.patchTask.emit(event.patch));
      }
    });

    // Carga el config-schema del backend cuando el tipo no tiene form registrado.
    effect(() => {
      const registered = this.isRegistered();
      const type = this.task().taskType;
      untracked(() => {
        if (registered) {
          this.schemaState.set('none');
          return;
        }
        this.schemaState.set('loading');
        this.configSchemas
          .schemaFor(type)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (schema) =>
              this.schemaState.set(schema?.fields?.length ? schema : 'none'),
            error: () => this.schemaState.set('none'),
          });
      });
    });
  }

  /** Persiste el valor del schema-form como {@code configurationJson} de la tarea. */
  onSchemaValue(value: SchemaFormValue): void {
    this.patchTask.emit({ configurationJson: JSON.stringify(value) });
  }
}
