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
import {
  SchemaFormComponent,
  SchemaFormSchema,
  SchemaFormValue,
  provideSchemaFieldRenderers,
} from '@integration-hub/shared/ui';
import { PluginConfigSchemaService } from '../../../api/plugin-config-schema.service';
import { MessagingTransportsService } from '../../../api/messaging-transports.service';
import { ProcessSchemaFieldContextService } from '../../../forms/process-schema-field-context.service';
import { ConnectionRef, ProcessTaskFormModel, ReaderRef, SourceRef } from '../../../models/process.models';
import { ProcessTokenFieldComponent } from '../process-token-field/process-token-field.component';
import { ProcessHttpRequestFieldComponent } from '../process-http-request-field/process-http-request-field.component';
import { ProcessRuntimeFieldComponent } from '../process-runtime-field/process-runtime-field.component';
import { AsyncDispatchSectionComponent } from '../async-dispatch-section/async-dispatch-section.component';
import { TaskContinueOnFailureComponent } from '../task-continue-on-failure/task-continue-on-failure.component';

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
  imports: [CommonModule, SchemaFormComponent, AsyncDispatchSectionComponent, TaskContinueOnFailureComponent],
  providers: [
    ProcessTaskFormBridgeService,
    // El campo custom `token-text` (autocompletado de tokens) queda disponible para el
    // ih-schema-form que renderiza el host (tipos de plugin / config schema-driven).
    ...provideSchemaFieldRenderers([
      { type: 'token-text', component: ProcessTokenFieldComponent },
      { type: 'http-request', component: ProcessHttpRequestFieldComponent },
      { type: 'runtime-panel', component: ProcessRuntimeFieldComponent },
    ]),
  ],
  templateUrl: './process-task-form-host.component.html',
  styleUrl: './process-task-form-host.component.css',
})
export class ProcessTaskFormHostComponent {
  /** Registro de formularios aportados por features (motor + verticales). */
  private readonly registry = inject(PROCESS_TASK_FORM_REGISTRY, { optional: true }) ?? [];
  /** Puente signal-based que recoge patches del componente dinamico. */
  private readonly bridge = inject(ProcessTaskFormBridgeService);
  private readonly configSchemas = inject(PluginConfigSchemaService);
  private readonly transportsApi = inject(MessagingTransportsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fieldContext = inject(ProcessSchemaFieldContextService);

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

  // --- Opciones comunes de ejecucion (async + continueOnFailure), renderizadas una vez por el host ---
  // Cooperan con el form por-tipo: la serializacion de estas claves vive en la base ProcessTaskProvider,
  // asi que un patch del form las preserva; y el merge del host preserva el resto de la config.

  /** Config parseada de la tarea (para leer las opciones comunes). */
  private readonly config = computed<Record<string, unknown>>(() => {
    try {
      const parsed = JSON.parse(this.task().configurationJson || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  });

  readonly asyncEnabled = computed(() => this.config()['async'] === true);
  readonly asyncTransport = computed(() => String(this.config()['asyncTransport'] ?? 'KAFKA'));
  readonly continueOnFailure = computed(() => this.config()['continueOnFailure'] === true);
  readonly executionMode = computed(() => String(this.config()['executionMode'] ?? 'once'));

  /** Transportes disponibles para el selector async (fallback ['KAFKA'] si el endpoint falla/403). */
  readonly transports = signal<readonly string[]>(['KAFKA']);

  onAsyncChange(value: boolean): void {
    this.patchConfig(value ? { async: true } : { async: undefined, asyncTransport: undefined });
  }

  onTransportChange(value: string): void {
    this.patchConfig({ asyncTransport: value });
  }

  onContinueOnFailureChange(value: boolean): void {
    this.patchConfig({ continueOnFailure: value ? true : undefined });
  }

  /** Mergea las claves comunes en la config actual (undefined = borrar) y persiste. */
  private patchConfig(patch: Record<string, unknown>): void {
    const next: Record<string, unknown> = { ...this.config() };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) {
        delete next[key];
      } else {
        next[key] = value;
      }
    }
    this.patchTask.emit({ configurationJson: JSON.stringify(next, null, 2) });
  }

  constructor() {
    // Publica el contexto de binding para los renderers de campo `token-text` del schema-form.
    effect(() => {
      const task = this.task();
      const tasks = this.tasks();
      const readers = this.readers();
      untracked(() => this.fieldContext.set(task, tasks, readers));
    });

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

    // Transportes disponibles para el selector async (una vez; fallback ['KAFKA'] ante error/403).
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
  }

  /** Persiste el valor del schema-form como {@code configurationJson} de la tarea. */
  onSchemaValue(value: SchemaFormValue): void {
    this.patchTask.emit({ configurationJson: JSON.stringify(value) });
  }
}
