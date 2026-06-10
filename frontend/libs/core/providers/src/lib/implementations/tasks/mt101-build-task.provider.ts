// @trace spec 008-mensajeria-pagos RF-001, T-003
// @trace ADR-009
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskProvider, ProcessTaskSummaryContext } from '../../tasks/process-task-provider.abstract';
import { ProcessTaskRuntimeDraft } from '../../tasks/process-task-binding.models';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

/** Sub-config del envelope SWIFT (block 1/2/3/5). */
export interface Mt101EnvelopeDraft {
  senderLt: string;
  receiverLt: string;
  uetrStrategy: 'perMessage' | 'fixed' | 'none';
  priority: 'N' | 'U' | 'S';
}

/** Sub-config de la cabecera (Sequence A). */
export interface Mt101SequenceADraft {
  sendersReferenceTemplate: string;
  requestedExecutionDate: string;
  orderingCustomerOption: 'F' | 'G' | 'H';
  orderingCustomerAccount: string;
  orderingCustomerNameAddress: string;
  accountServicingOption: 'A' | 'C' | '';
  accountServicingBic: string;
}

/** Mapeo de campos del record hacia los campos de Sequence B. */
export interface Mt101TransactionMappingsDraft {
  transactionReferenceTemplate: string;
  amountCurrencyField: string;
  amountValueField: string;
  orderingCustomerOption: '' | 'F' | 'G' | 'H';
  orderingCustomerAccountField: string;
  orderingCustomerBicField: string;
  orderingCustomerNameAddressFields: string;
  beneficiaryOption: '' | 'A' | 'F';
  beneficiaryAccountField: string;
  beneficiaryBicField: string;
  beneficiaryNameAddressFields: string;
  accountWithBicField: string;
  remittanceInformationField: string;
  detailsOfChargesField: string;
}

/** Draft completo del formulario MT101_BUILD. */
export interface Mt101BuildTaskDraft extends ProcessTaskRuntimeDraft {
  format: 'JSON' | 'XML' | 'FIN';
  envelope: Mt101EnvelopeDraft;
  sequenceA: Mt101SequenceADraft;
  transactionMappings: Mt101TransactionMappingsDraft;
  splitStrategy: 'none' | 'debitAccount' | 'maxTransactions';
  maxTransactionsPerMessage: number;
}

/**
 * Provider del task type {@code MT101_BUILD}: convierte entre el draft del
 * formulario y el {@code configuration_json} que persiste el backend.
 */
@Injectable()
export class Mt101BuildTaskProvider extends ProcessTaskProvider<Mt101BuildTaskDraft> {
  readonly descriptor = {
    type: 'MT101_BUILD' as const,
    labelKey: 'processTask.MT101_BUILD',
    descriptionKey: 'processTaskDescription.MT101_BUILD',
    modalLayout: 'workspace' as const,
  };

  createDraft(): Mt101BuildTaskDraft {
    return {
      taskRef: '',
      executionMode: 'once',
      format: 'JSON',
      envelope: {
        senderLt: '',
        receiverLt: '',
        uetrStrategy: 'perMessage',
        priority: 'N',
      },
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
        orderingCustomerOption: '',
        orderingCustomerAccountField: '',
        orderingCustomerBicField: '',
        orderingCustomerNameAddressFields: '',
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

  hydrateDraft(task: ProcessTaskFormModel): Mt101BuildTaskDraft {
    const config: Record<string, any> = this.parseJson(task.configurationJson);
    const runtime = this.hydrateRuntime(task, 'once');
    const envelope = (config['envelope'] || {}) as Record<string, any>;
    const sequenceA = (config['sequenceA'] || {}) as Record<string, any>;
    const orderingCustomer = (sequenceA['orderingCustomer'] || {}) as Record<string, any>;
    const accountServicing = (sequenceA['accountServicingInstitution'] || {}) as Record<string, any>;
    const mappings = (config['transactionMappings'] || {}) as Record<string, any>;
    const amount = (mappings['amount'] || {}) as Record<string, any>;
    const transactionOrderingCustomer = (mappings['orderingCustomer'] || {}) as Record<string, any>;
    const beneficiary = (mappings['beneficiary'] || {}) as Record<string, any>;
    const accountWith = (mappings['accountWithInstitution'] || {}) as Record<string, any>;
    const split = (config['splitBy'] || {}) as Record<string, any>;

    return {
      ...runtime,
      executionMode: 'once',
      format: this.normalizeFormat(config['format']),
      envelope: {
        senderLt: String(envelope['senderLt'] || ''),
        receiverLt: String(envelope['receiverLt'] || ''),
        uetrStrategy: this.normalizeUetrStrategy(envelope['uetrStrategy']),
        priority: this.normalizePriority(envelope['priority']),
      },
      sequenceA: {
        sendersReferenceTemplate: String(sequenceA['sendersReferenceTemplate'] || sequenceA['sendersReference'] || ''),
        requestedExecutionDate: String(sequenceA['requestedExecutionDate'] || ''),
        orderingCustomerOption: this.normalizeOrderingOption(orderingCustomer['option']),
        orderingCustomerAccount: String(orderingCustomer['account'] || ''),
        orderingCustomerNameAddress: this.joinLines(orderingCustomer['nameAndAddress']),
        accountServicingOption: this.normalizeServicingOption(accountServicing['option']),
        accountServicingBic: String(accountServicing['bic'] || ''),
      },
      transactionMappings: {
        transactionReferenceTemplate: String(mappings['transactionReferenceTemplate'] || ''),
        amountCurrencyField: String(amount['currencyField'] || ''),
        amountValueField: String(amount['valueField'] || ''),
        orderingCustomerOption: this.normalizeOptionalOrderingOption(transactionOrderingCustomer['option']),
        orderingCustomerAccountField: String(transactionOrderingCustomer['accountField'] || ''),
        orderingCustomerBicField: String(transactionOrderingCustomer['bicField'] || ''),
        orderingCustomerNameAddressFields: this.joinLines(transactionOrderingCustomer['nameAndAddressFields']),
        beneficiaryOption: this.normalizeBeneficiaryOption(beneficiary['option']),
        beneficiaryAccountField: String(beneficiary['accountField'] || ''),
        beneficiaryBicField: String(beneficiary['bicField'] || ''),
        beneficiaryNameAddressFields: this.joinLines(beneficiary['nameAndAddressFields']),
        accountWithBicField: String(accountWith['bicField'] || ''),
        remittanceInformationField: String(mappings['remittanceInformationField'] || ''),
        detailsOfChargesField: String(mappings['detailsOfChargesField'] || ''),
      },
      splitStrategy: this.normalizeSplitStrategy(split['strategy']),
      maxTransactionsPerMessage: Number(split['maxTransactionsPerMessage']) || 999,
    };
  }

  toTaskPatch(draft: Mt101BuildTaskDraft): Partial<ProcessTaskFormModel> {
    const payload: Record<string, unknown> = this.withRuntime(
      {
        format: draft.format,
        envelope: {
          senderLt: draft.envelope.senderLt,
          receiverLt: draft.envelope.receiverLt,
          uetrStrategy: draft.envelope.uetrStrategy,
          priority: draft.envelope.priority,
        },
        sequenceA: {
          sendersReferenceTemplate: draft.sequenceA.sendersReferenceTemplate,
          requestedExecutionDate: draft.sequenceA.requestedExecutionDate,
          orderingCustomer: this.compactObject({
            option: draft.sequenceA.orderingCustomerOption,
            account: draft.sequenceA.orderingCustomerAccount,
            nameAndAddress: this.splitLines(draft.sequenceA.orderingCustomerNameAddress),
          }),
          accountServicingInstitution: draft.sequenceA.accountServicingOption
            ? this.compactObject({
                option: draft.sequenceA.accountServicingOption,
                bic: draft.sequenceA.accountServicingBic,
              })
            : undefined,
        },
        transactionMappings: {
          transactionReferenceTemplate: draft.transactionMappings.transactionReferenceTemplate,
          amount: this.compactObject({
            currencyField: draft.transactionMappings.amountCurrencyField,
            valueField: draft.transactionMappings.amountValueField,
          }),
          orderingCustomer: this.compactObject({
            option: draft.transactionMappings.orderingCustomerOption,
            accountField: draft.transactionMappings.orderingCustomerAccountField,
            bicField: draft.transactionMappings.orderingCustomerBicField,
            nameAndAddressFields: this.splitLines(draft.transactionMappings.orderingCustomerNameAddressFields),
          }),
          beneficiary: this.compactObject({
            option: draft.transactionMappings.beneficiaryOption,
            accountField: draft.transactionMappings.beneficiaryAccountField,
            bicField: draft.transactionMappings.beneficiaryBicField,
            nameAndAddressFields: this.splitLines(draft.transactionMappings.beneficiaryNameAddressFields),
          }),
          accountWithInstitution: draft.transactionMappings.accountWithBicField
            ? { option: 'A', bicField: draft.transactionMappings.accountWithBicField }
            : undefined,
          remittanceInformationField: draft.transactionMappings.remittanceInformationField || undefined,
          detailsOfChargesField: draft.transactionMappings.detailsOfChargesField || undefined,
        },
        splitBy: {
          strategy: draft.splitStrategy,
          maxTransactionsPerMessage: draft.maxTransactionsPerMessage,
          rebuildIndexTotal: true,
        },
      },
      draft,
      'once',
    );
    return { configurationJson: this.toPrettyJson(this.compactObject(payload) as Record<string, unknown>) };
  }

  override summarize(task: ProcessTaskFormModel, _context: ProcessTaskSummaryContext, i18n: I18nService): string {
    const config = this.hydrateDraft(task);
    const summary = `format=${config.format} | ${config.envelope.senderLt || '?'} -> ${config.envelope.receiverLt || '?'}`;
    return [i18n.t(this.descriptor.labelKey), summary].filter(Boolean).join(' | ');
  }

  // --- helpers ---

  private normalizeFormat(value: unknown): 'JSON' | 'XML' | 'FIN' {
    const v = String(value || 'JSON').toUpperCase();
    return v === 'XML' || v === 'FIN' ? v : 'JSON';
  }

  private normalizeUetrStrategy(value: unknown): 'perMessage' | 'fixed' | 'none' {
    const v = String(value || 'perMessage');
    return v === 'fixed' || v === 'none' ? v : 'perMessage';
  }

  private normalizePriority(value: unknown): 'N' | 'U' | 'S' {
    const v = String(value || 'N').toUpperCase();
    return v === 'U' || v === 'S' ? v : 'N';
  }

  private normalizeOrderingOption(value: unknown): 'F' | 'G' | 'H' {
    const v = String(value || 'H').toUpperCase();
    return v === 'F' || v === 'G' ? v : 'H';
  }

  private normalizeOptionalOrderingOption(value: unknown): '' | 'F' | 'G' | 'H' {
    const v = String(value || '').toUpperCase();
    return v === 'F' || v === 'G' || v === 'H' ? v : '';
  }

  private normalizeServicingOption(value: unknown): 'A' | 'C' | '' {
    const v = String(value || '').toUpperCase();
    return v === 'A' || v === 'C' ? v : '';
  }

  private normalizeBeneficiaryOption(value: unknown): '' | 'A' | 'F' {
    const v = String(value || '').toUpperCase();
    return v === 'A' || v === 'F' ? v : '';
  }

  private normalizeSplitStrategy(value: unknown): 'none' | 'debitAccount' | 'maxTransactions' {
    const v = String(value || 'none');
    return v === 'debitAccount' || v === 'maxTransactions' ? v : 'none';
  }

  private joinLines(value: unknown): string {
    if (Array.isArray(value)) {
      return value.filter(Boolean).map(String).join('\n');
    }
    return String(value || '');
  }

  private splitLines(value: string): string[] {
    return (value || '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  /** Quita claves con valores vacios/undefined/array vacio para no inflar el JSON. */
  private compactObject<T extends Record<string, unknown>>(obj: T): T {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue;
      if (typeof value === 'string' && value === '') continue;
      if (Array.isArray(value) && value.length === 0) continue;
      if (typeof value === 'object' && !Array.isArray(value)) {
        const nested = this.compactObject(value as Record<string, unknown>);
        if (Object.keys(nested).length === 0) continue;
        out[key] = nested;
      } else {
        out[key] = value;
      }
    }
    return out as T;
  }
}
