// @trace spec 008-mensajeria-pagos RF-006, T-021
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Mt101ReconcileTaskDraft,
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ConnectionRef, ProcessTaskFormModel } from '../../../models/process.models';

@Component({
  selector: 'ih-process-mt101-reconcile-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './process-mt101-reconcile-task-form.component.html',
  styleUrl: './process-mt101-reconcile-task-form.component.css',
})
export class ProcessMt101ReconcileTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly connections = input.required<readonly ConnectionRef[]>();
  readonly readonly = input(false);

  readonly draft = computed<Mt101ReconcileTaskDraft>(
    () => this.manager.hydrateDraft<Mt101ReconcileTaskDraft>(this.task()) ?? this.defaultDraft(),
  );

  updateDraft(patch: Partial<Mt101ReconcileTaskDraft>): void {
    const next: Mt101ReconcileTaskDraft = { ...this.draft(), ...patch };
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, next));
  }

  private defaultDraft(): Mt101ReconcileTaskDraft {
    return {
      taskRef: this.task().clientId,
      executionMode: 'once',
      connectionRef: '',
      sentTable: 'mt101_archive',
      confirmationTable: 'mt101_confirmation',
      matchKeys: 'senders_reference',
      asOfDate: '${today}',
      lookbackDays: 5,
      exceptionConnectionRef: '',
      exceptionTable: 'mt101_reconciliation_exception',
    };
  }
}
