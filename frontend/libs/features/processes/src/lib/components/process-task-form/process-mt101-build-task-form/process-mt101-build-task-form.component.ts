// @trace spec 008-mensajeria-pagos RF-001, T-011 (UI MT101_BUILD)
// @trace ADR-009
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Mt101BuildTaskDraft,
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskFormModel } from '../../../models/process.models';

/**
 * Formulario de configuracion para tareas {@code MT101_BUILD}.
 *
 * <p>Componente standalone que se registra en {@code PROCESS_TASK_FORM_REGISTRY} via
 * {@code provideMt101BuildForm()}. El host lo instancia dinamicamente con
 * {@code ngComponentOutlet}; los patches al draft viajan al host por
 * {@link ProcessTaskFormBridgeService}.</p>
 */
@Component({
  selector: 'ih-process-mt101-build-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './process-mt101-build-task-form.component.html',
  styleUrl: './process-mt101-build-task-form.component.css',
})
export class ProcessMt101BuildTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly readonly = input(false);

  readonly draft = computed<Mt101BuildTaskDraft>(
    () =>
      this.manager.hydrateDraft<Mt101BuildTaskDraft>(this.task()) ?? this.defaultDraft(),
  );

  readonly formatOptions: ReadonlyArray<'JSON' | 'XML' | 'FIN'> = ['JSON', 'XML', 'FIN'];
  readonly uetrStrategies: ReadonlyArray<{ value: string; labelKey: string }> = [
    { value: 'perMessage', labelKey: 'mt101.uetr.perMessage' },
    { value: 'fixed', labelKey: 'mt101.uetr.fixed' },
    { value: 'none', labelKey: 'mt101.uetr.none' },
  ];
  readonly orderingOptions = ['F', 'G', 'H'] as const;
  readonly servicingOptions: ReadonlyArray<'A' | 'C' | ''> = ['', 'A', 'C'];
  readonly beneficiaryOptions: ReadonlyArray<'' | 'A' | 'F'> = ['', 'A', 'F'];
  readonly splitStrategies: ReadonlyArray<'none' | 'debitAccount' | 'maxTransactions'> = [
    'none',
    'debitAccount',
    'maxTransactions',
  ];

  /**
   * Emite el draft completo cada vez que cambia. El parent NO escucha esto via
   * {@code @Output()} (incompatible con {@code ngComponentOutlet}); en su lugar el
   * {@link ProcessTaskFormBridgeService} entrega el patch.
   */
  updateDraft(patch: Partial<Mt101BuildTaskDraft>): void {
    const next: Mt101BuildTaskDraft = { ...this.draft(), ...patch };
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, next));
  }

  updateEnvelope(patch: Partial<Mt101BuildTaskDraft['envelope']>): void {
    this.updateDraft({ envelope: { ...this.draft().envelope, ...patch } });
  }

  updateSequenceA(patch: Partial<Mt101BuildTaskDraft['sequenceA']>): void {
    this.updateDraft({ sequenceA: { ...this.draft().sequenceA, ...patch } });
  }

  updateMappings(patch: Partial<Mt101BuildTaskDraft['transactionMappings']>): void {
    this.updateDraft({
      transactionMappings: { ...this.draft().transactionMappings, ...patch },
    });
  }

  private defaultDraft(): Mt101BuildTaskDraft {
    return {
      taskRef: this.task().clientId,
      executionMode: 'once',
      format: 'JSON',
      envelope: { senderLt: '', receiverLt: '', uetrStrategy: 'perMessage', priority: 'N' },
      sequenceA: {
        sendersReferenceTemplate: 'PROC-${_processExecutionId}',
        requestedExecutionDate: '${today+1bd}',
        orderingCustomerOption: 'H',
        orderingCustomerAccount: '',
        orderingCustomerNameAddress: '',
        accountServicingOption: '',
        accountServicingBic: '',
      },
      transactionMappings: {
        transactionReferenceTemplate: 'TX-${_processExecutionId}-${recordNumber}',
        amountCurrencyField: '',
        amountValueField: '',
        beneficiaryOption: '',
        beneficiaryAccountField: '',
        beneficiaryBicField: '',
        beneficiaryNameAddressFields: '',
        accountWithBicField: '',
        remittanceInformationField: '',
        detailsOfChargesField: '',
      },
      splitStrategy: 'none',
      maxTransactionsPerMessage: 999,
    };
  }
}
