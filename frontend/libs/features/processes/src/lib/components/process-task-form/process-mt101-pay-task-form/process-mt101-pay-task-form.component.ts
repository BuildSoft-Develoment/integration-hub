// @trace spec 008-mensajeria-pagos RF-004, RF-016, T-011
// @trace ADR-009
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  Mt101PayAuthType,
  Mt101PayBackoffStrategy,
  Mt101PayConfirmationMode,
  Mt101PayTaskDraft,
  Mt101PayTransport,
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskFormModel } from '../../../models/process.models';
import { ProcessTaskRuntimePanelComponent } from '../process-task-runtime-panel/process-task-runtime-panel.component';

@Component({
  selector: 'ih-process-mt101-pay-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, ProcessTaskRuntimePanelComponent],
  templateUrl: './process-mt101-pay-task-form.component.html',
  styleUrl: './process-mt101-pay-task-form.component.css',
})
export class ProcessMt101PayTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly readonly = input(false);

  readonly draft = computed<Mt101PayTaskDraft>(
    () => this.manager.hydrateDraft<Mt101PayTaskDraft>(this.task()) ?? this.defaultDraft(),
  );

  readonly transports: ReadonlyArray<Mt101PayTransport> = ['REST', 'SFTP'];
  readonly authTypes: ReadonlyArray<Mt101PayAuthType> = ['', 'bearer', 'login-request'];
  readonly confirmationModes: ReadonlyArray<Mt101PayConfirmationMode> = ['sync', 'async-callback', 'async-poll'];
  readonly backoffStrategies: ReadonlyArray<Mt101PayBackoffStrategy> = ['exponential', 'constant'];
  readonly httpMethods: ReadonlyArray<string> = ['POST', 'PUT', 'PATCH'];

  updateDraft(patch: Partial<Mt101PayTaskDraft>): void {
    const next: Mt101PayTaskDraft = { ...this.draft(), ...patch };
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, next));
  }

  updateRest(patch: Partial<Mt101PayTaskDraft['rest']>): void {
    this.updateDraft({ rest: { ...this.draft().rest, ...patch } });
  }

  updateRetry(patch: Partial<Mt101PayTaskDraft['retryPolicy']>): void {
    this.updateDraft({ retryPolicy: { ...this.draft().retryPolicy, ...patch } });
  }

  updateResponse(patch: Partial<Mt101PayTaskDraft['expectedGatewayResponse']>): void {
    this.updateDraft({ expectedGatewayResponse: { ...this.draft().expectedGatewayResponse, ...patch } });
  }

  private defaultDraft(): Mt101PayTaskDraft {
    return {
      taskRef: this.task().clientId,
      executionMode: 'per-record',
      transport: 'REST',
      rest: {
        url: '',
        method: 'POST',
        authType: '',
        token: '',
        loginUrl: '',
        loginMethod: 'POST',
        loginHeadersJson: '',
        loginBodyTemplate: '',
        tokenPath: '$.access_token',
        extraHeadersJson: '',
        contentType: 'application/json',
        timeoutSeconds: 60,
      },
      idempotencyKeyTemplate: '${sendersReference}',
      retryPolicy: {
        maxRetries: 5,
        backoffStrategy: 'exponential',
        initialBackoffSeconds: 30,
        maxBackoffSeconds: 900,
        retryOnFamilies: 'TIMEOUT,5xx,CONNECTION_REFUSED',
      },
      confirmationMode: 'sync',
      expectedGatewayResponse: {
        successField: '$.accepted',
        referenceField: '$.gatewayReference',
        errorMessageField: '$.error.message',
      },
    };
  }
}
