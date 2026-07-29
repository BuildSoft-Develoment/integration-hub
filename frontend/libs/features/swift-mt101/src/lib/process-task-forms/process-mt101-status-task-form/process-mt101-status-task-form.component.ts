// @trace spec 008-mensajeria-pagos RF-005, T-021
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import {
  ProcessTaskExecutionMode,
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import {
  Mt101StatusMode,
  Mt101StatusRouteDraft,
  Mt101StatusTaskDraft,
} from '../../process-tasks';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ConnectionRef, ProcessTaskFormModel, SourceRef } from '@integration-hub/core/providers';
import { ProcessTaskRuntimePanelComponent } from '@integration-hub/shared/process-form-kit';
import { ConnectionSelectComponent } from '@integration-hub/shared/process-form-kit';
import { TaskFormShellComponent } from '@integration-hub/shared/process-form-kit';

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
  /** ADR-017: fuentes para el picker de `sinkRef` por ruta. Opcional: el host ya lo pasa a todos los forms. */
  readonly sources = input<readonly SourceRef[]>([]);
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
   *
   * <p>Tambien se restringe cuando la tarea trae {@code resolveNormalPay} (conciliacion in-line del PAY
   * normal), porque ese camino EMITE la señal de conciliacion y el backend lo guarda igual. Sin esto se podia
   * guardar un STATUS con resolveNormalPay + per-record que solo reventaba AL EJECUTARSE, en pleno money-path.
   * El flag hoy llega por config sembrada (el form todavia no lo expone), pero el selector ya lo respeta.</p>
   */
  readonly executionModes = computed<readonly ProcessTaskExecutionMode[]>(() =>
    this.draft().mode === 'query' && !this.draft().resolveNormalPay
      ? ['once', 'per-record', 'batch']
      : ['once'],
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

  // ---- ADR-017: STATUS por ruta ----

  readonly routeTransports: ReadonlyArray<Mt101StatusRouteDraft['transport']> = ['REST', 'SFTP'];

  /**
   * Mismo filtro que MT101_PAY y FILE_DELIVER: la conexion del banco es una fuente OUTPUT/BOTH activa.
   * Una fuente de LECTURA aqui haria que el STATUS consultara el ACK contra otro servidor y reportara
   * "sin respuesta del banco" en silencio — el backend la rechaza, pero no hay razon para ofrecerla.
   */
  readonly sinkOptions = computed(() =>
    this.sources().filter((source) => source.active !== false && this.isSink(source.direction)),
  );

  private isSink(direction?: string): boolean {
    const normalized = (direction ?? 'INPUT').toUpperCase();
    return normalized === 'OUTPUT' || normalized === 'BOTH';
  }

  /** El template usa `String(...)` para comparar el valor del select con el sinkRef del draft. */
  readonly String = String;

  addRoute(): void {
    this.updateDraft({
      routeQuery: [
        ...this.draft().routeQuery,
        {
          route: '',
          transport: 'REST',
          url: '',
          sinkRef: '',
          responseFileTemplate: '',
          acceptedTokens: '',
          rejectedTokens: '',
          rest: {},
        },
      ],
    });
  }

  updateRoute(index: number, patch: Partial<Mt101StatusRouteDraft>): void {
    const routeQuery = this.draft().routeQuery.map((route, position) =>
      position === index ? { ...route, ...patch } : route,
    );
    this.updateDraft({ routeQuery });
  }

  removeRoute(index: number): void {
    this.updateDraft({ routeQuery: this.draft().routeQuery.filter((_, position) => position !== index) });
  }
}
