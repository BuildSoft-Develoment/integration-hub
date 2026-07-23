import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  Mt101InboundDeliverTaskDraft,
  Mt101InboundDeliverTransport,
  MT101_INBOUND_DELIVER_DB_TABLE,
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskFormModel, ReaderRef } from '../../../../../models/process.models';
import { ProcessHttpRequestComponent } from '../../../shared/process-http-request/process-http-request.component';
import { ProcessTaskRuntimePanelComponent } from '../../../shared/process-task-runtime-panel/process-task-runtime-panel.component';
import { TaskFormShellComponent } from '../../../shared/task-form-shell/task-form-shell.component';

/**
 * Form propio de MT101_INBOUND_DELIVER. Expone lo que el backend lee: transporte DB/REST + pageSize. Para REST
 * reusa ih-process-http-request (auth/login/headers), igual que REST_CALL y el webhook de NOTIFICATION; en DB
 * la tabla destino es fija (informativa, read-only).
 */
@Component({
  selector: 'ih-process-mt101-inbound-deliver-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ProcessHttpRequestComponent,
    ProcessTaskRuntimePanelComponent,
    TaskFormShellComponent,
  ],
  templateUrl: './process-mt101-inbound-deliver-task-form.component.html',
  styleUrl: './process-mt101-inbound-deliver-task-form.component.css',
})
export class ProcessMt101InboundDeliverTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly readonly = input(false);

  readonly draft = computed<Mt101InboundDeliverTaskDraft>(
    () => this.manager.draftFor<Mt101InboundDeliverTaskDraft>(this.task()),
  );

  readonly transports: ReadonlyArray<Mt101InboundDeliverTransport> = ['DB', 'REST'];
  /** Tabla de negocio fija a la que entrega el transporte DB (informativa). */
  readonly dbTable = MT101_INBOUND_DELIVER_DB_TABLE;

  updateDraft(patch: Partial<Mt101InboundDeliverTaskDraft>): void {
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, { ...this.draft(), ...patch }));
  }
}
