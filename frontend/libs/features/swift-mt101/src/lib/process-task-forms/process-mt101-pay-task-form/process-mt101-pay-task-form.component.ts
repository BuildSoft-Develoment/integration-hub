// @trace spec 008-mensajeria-pagos RF-004, RF-016, T-011
// @trace ADR-009
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import {
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import {
  Mt101PayAuthType,
  Mt101PayBackoffStrategy,
  Mt101PayConfirmationMode,
  Mt101PayDuplicatePolicy,
  Mt101PaySftpDraft,
  Mt101PayTaskDraft,
  Mt101PayTransport,
} from '../../process-tasks';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskFormModel, SourceRef } from '@integration-hub/core/providers';
import { ProcessTaskRuntimePanelComponent } from '@integration-hub/shared/process-form-kit';
import { TaskFormShellComponent } from '@integration-hub/shared/process-form-kit';

@Component({
  selector: 'ih-process-mt101-pay-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    ProcessTaskRuntimePanelComponent,
    TaskFormShellComponent,
  ],
  templateUrl: './process-mt101-pay-task-form.component.html',
  styleUrl: './process-mt101-pay-task-form.component.css',
})
export class ProcessMt101PayTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly sources = input<readonly SourceRef[]>([]);
  readonly readonly = input(false);

  readonly draft = computed<Mt101PayTaskDraft>(
    () => this.manager.draftFor<Mt101PayTaskDraft>(this.task()),
  );

  readonly transports: ReadonlyArray<Mt101PayTransport> = ['REST', 'SFTP'];
  // G1 (money-path): MT101_PAY solo corre en 'once' y el backend lo valida fail-loud
  // (Mt101PayTaskProvider.guardExecutionMode). En batch/per-record el motor descarta needsReconciliation, asi que
  // un pago UNCERTAIN cerraria como FAILED opaco en vez de NEEDS_RECONCILIATION. No se ofrecen los otros modos.
  readonly executionModes = ['once'] as const;
  readonly authTypes: ReadonlyArray<Mt101PayAuthType> = ['', 'bearer', 'login-request'];
  readonly confirmationModes: ReadonlyArray<Mt101PayConfirmationMode> = ['sync', 'async-callback', 'async-poll'];
  readonly backoffStrategies: ReadonlyArray<Mt101PayBackoffStrategy> = ['exponential', 'constant'];
  readonly duplicatePolicies: ReadonlyArray<Mt101PayDuplicatePolicy> = [
    'SKIP_IF_SAME_HASH', 'FAIL', 'OVERWRITE', 'RENAME_WITH_SUFFIX',
  ];
  readonly httpMethods: ReadonlyArray<string> = ['POST', 'PUT', 'PATCH'];

  // ADR-017: el destino SFTP (sinkRef) debe ser una fuente activa OUTPUT/BOTH (un sink), igual que FILE_DELIVER.
  // El backend valida allowsOutput(); el picker ya ofrece solo candidatos validos.
  readonly sinkOptions = computed(() =>
    this.sources().filter((source) => source.active !== false && this.isSink(source.direction)),
  );

  private isSink(direction?: string): boolean {
    const normalized = (direction ?? 'INPUT').toUpperCase();
    return normalized === 'OUTPUT' || normalized === 'BOTH';
  }

  // El draft declara sinkRef como string (se hidrata con String(...) desde configuration_json) pero las
  // opciones emiten el id NUMERICO de la fuente. Sin comparador propio mat-select usa ===, "7" !== 7: al
  // recomputarse el draft no reconocia el valor recien elegido y lo revertia a vacio en el mismo ciclo, asi
  // que el destino del PAY no llegaba a guardarse nunca y la entrega moria en invalidated=1 tras agotar los
  // reintentos. Se compara y se normaliza como string; el provider ya emite Number(sinkRef) al serializar.
  readonly sameSink = (a: unknown, b: unknown): boolean => this.sinkRefOf(a) === this.sinkRefOf(b);

  sinkRefOf(value: unknown): string {
    return value == null ? '' : String(value);
  }

  updateDraft(patch: Partial<Mt101PayTaskDraft>): void {
    const next: Mt101PayTaskDraft = { ...this.draft(), ...patch };
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, next));
  }

  updateRest(patch: Partial<Mt101PayTaskDraft['rest']>): void {
    this.updateDraft({ rest: { ...this.draft().rest, ...patch } });
  }

  updateSftp(patch: Partial<Mt101PaySftpDraft>): void {
    this.updateDraft({ sftp: { ...this.draft().sftp, ...patch } });
  }

  updateRetry(patch: Partial<Mt101PayTaskDraft['retryPolicy']>): void {
    this.updateDraft({ retryPolicy: { ...this.draft().retryPolicy, ...patch } });
  }

  updateResponse(patch: Partial<Mt101PayTaskDraft['expectedGatewayResponse']>): void {
    this.updateDraft({ expectedGatewayResponse: { ...this.draft().expectedGatewayResponse, ...patch } });
  }
}
