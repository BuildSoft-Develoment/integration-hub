// @trace spec 008-mensajeria-pagos RF-001, T-003
// @trace ADR-009
import { Injectable } from '@angular/core';
import { I18nService } from '@integration-hub/core/i18n';
import { ProcessTaskProvider, ProcessTaskProviderDescriptor, ProcessTaskSummaryContext } from '../../../../tasks/process-task-provider.abstract';
import { ProcessTaskRuntimeDraft } from '../../../../tasks/process-task-binding.models';
import { ProcessTaskFormModel } from '../../../../tasks/process-task.models';

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
  instructingPartyOption: 'L' | '';
  instructingPartyIdentifier: string;
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
  accountServicingOption: '' | 'A' | 'C';
  accountServicingAccountField: string;
  accountServicingBicField: string;
  beneficiaryOption: '' | 'A' | 'F';
  beneficiaryAccountField: string;
  beneficiaryBicField: string;
  beneficiaryNameAddressFields: string;
  accountWithBicField: string;
  remittanceInformationField: string;
  detailsOfChargesField: string;
}

/** Draft de construccion MT101 (base compartida + MT101_BUILD_FROM_TABLE). */
export interface Mt101BuildTaskDraft extends ProcessTaskRuntimeDraft {
  format: 'JSON' | 'XML' | 'FIN';
  debitAccountMode: 'singleDebit' | 'multipleDebit' | 'subsidiary';
  envelope: Mt101EnvelopeDraft;
  sequenceA: Mt101SequenceADraft;
  transactionMappings: Mt101TransactionMappingsDraft;
  splitStrategy: 'none' | 'debitAccount' | 'maxTransactions';
  maxTransactionsPerMessage: number;
  /** Tabla de staging de la que se construyen los pagos (override; en blanco el backend la deriva de la tarea de origen). */
  sourceTable: string;
  /** Conexion de la tabla de origen (vacia = datasource de la plataforma / se hereda de la tarea de origen). */
  sourceConnectionRef: string;
  sourcePayloadColumn: string;
  sourceIdColumn: string;
  /**
   * Resto del objeto {@code source} que el backend lee y el form no expone: {@code processExecutionId},
   * {@code taskDefinitionId} (scope del lote) y {@code recordIndexIn}/{@code rebuildRunId} (acotan un rebuild
   * selectivo). Se preservan verbatim: exponer la tabla no debe des-acotar un rebuild.
   */
  preservedSource: Record<string, unknown>;
  /** Claves que el backend lee y el form no gobierna; viajan verbatim (ver BUILD_PRESERVED_KEYS). */
  preserved: Record<string, unknown>;
  /** Claves ANIDADAS que el backend lee y el form no gobierna (ver BUILD_ENVELOPE_KEYS / BUILD_SEQUENCE_A_KEYS). */
  preservedEnvelope: Record<string, unknown>;
  preservedSequenceA: Record<string, unknown>;
}

/**
 * Base compartida de construccion MT101: convierte entre el draft del formulario y
 * el {@code configuration_json}. <b>No se registra como task type propio</b>: el
 * tipo en memoria {@code MT101_BUILD} se removio (no escala); la unica subclase
 * concreta y registrada es {@link Mt101BuildFromTableTaskProvider} (paginado desde
 * staging), que reusa este draft, esta serializacion y el mismo formulario.
 */

/**
 * Claves de nivel superior que MT101_BUILD_FROM_TABLE lee del backend y el formulario no gobierna:
 * - `fragmentSetIdTemplate`: identidad del set producido, que consumen VALIDATE/ARCHIVE/PAY. Combinado con
 *   `replaceExisting` (que el form fuerza a true) tambien cambia QUE set existente se borra.
 * - `maxBytesPerMessage` y `replaceExisting` los FIJA la subclase a una constante (10000 / true) y el form no
 *   los expone: una config con otro valor se reescribia al guardar. `replaceExisting=false` en particular es lo
 *   que impide borrar el fragment set anterior; forzarlo a true lo BORRA.
 *
 * <p>{@code source} y {@code connectionRef} salieron de aca: ahora los gobierna el form (tabla de origen +
 * conexion), con el resto del objeto {@code source} preservado en {@code preservedSource}.</p>
 */
const BUILD_PRESERVED_KEYS = ['fragmentSetIdTemplate', 'maxBytesPerMessage', 'replaceExisting'] as const;

/**
 * Sub-claves de {@code source} que el FORM gobierna. El resto del objeto ({@code processExecutionId},
 * {@code taskDefinitionId}, {@code recordIndexIn}, {@code rebuildRunId}) se preserva verbatim: exponer la
 * tabla no debe des-acotar un rebuild selectivo.
 */
const BUILD_SOURCE_EXPOSED_KEYS = ['table', 'payloadColumn', 'idColumn'] as const;

/**
 * {@code envelope.uetr} lo lee {@code resolveUetr} cuando {@code uetrStrategy === 'fixed'}. El form rearma el
 * envelope con cuatro campos y no incluye la UETR, asi que guardar con la estrategia 'fixed' la BORRABA y el
 * mensaje salia sin la referencia unica punta a punta (la que sirve para rastrear el pago).
 */
const BUILD_ENVELOPE_KEYS = ['uetr'] as const;

/**
 * Campos MT101 de Sequence A que el backend lee ({@code buildSequenceA}) y el form no tiene: 21R
 * ({@code customerSpecifiedReference}, la referencia de lote del cliente) y 25 ({@code authorisation}). Van
 * dentro del mensaje que se envia al banco; el form rearma sequenceA desde cero y los borraba.
 */
const BUILD_SEQUENCE_A_KEYS = ['customerSpecifiedReference', 'authorisation'] as const;

/** Espeja {@code DEFAULT_MAX_TRANSACTIONS} del backend. El 999 que habia aca NO era el default real. */
export const DEFAULT_MAX_TRANSACTIONS = 100;

/** Espeja {@code DEFAULT_MAX_BYTES} del backend. */
export const DEFAULT_MAX_BYTES = 10000;

@Injectable()
export class Mt101BuildTaskProvider extends ProcessTaskProvider<Mt101BuildTaskDraft> {
  readonly descriptor: ProcessTaskProviderDescriptor = {
    type: 'MT101_BUILD_FROM_TABLE' as const,
    labelKey: 'processTask.MT101_BUILD_FROM_TABLE',
    descriptionKey: 'processTaskDescription.MT101_BUILD_FROM_TABLE',
    modalLayout: 'workspace' as const,
  };

  createDraft(): Mt101BuildTaskDraft {
    return {
      taskRef: '',
      executionMode: 'once',
      format: 'JSON',
      debitAccountMode: 'singleDebit',
      envelope: {
        senderLt: '',
        receiverLt: '',
        uetrStrategy: 'perMessage',
        priority: 'N',
      },
      sequenceA: {
        sendersReferenceTemplate: 'PROC-${_processExecutionId}',
        requestedExecutionDate: '${today+1bd}',
        instructingPartyOption: '',
        instructingPartyIdentifier: '',
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
        accountServicingOption: '',
        accountServicingAccountField: '',
        accountServicingBicField: '',
        beneficiaryOption: '',
        beneficiaryAccountField: '',
        beneficiaryBicField: '',
        beneficiaryNameAddressFields: '',
        accountWithBicField: '',
        remittanceInformationField: '',
        detailsOfChargesField: '',
      },
      splitStrategy: 'none',
      maxTransactionsPerMessage: DEFAULT_MAX_TRANSACTIONS,
      sourceTable: '',
      sourceConnectionRef: '',
      sourcePayloadColumn: '',
      sourceIdColumn: '',
      preservedSource: {},
      preserved: {},
      preservedEnvelope: {},
      preservedSequenceA: {},
    };
  }

  hydrateDraft(task: ProcessTaskFormModel): Mt101BuildTaskDraft {
    const config: Record<string, any> = this.parseJson(task.configurationJson);
    const runtime = this.hydrateRuntime(task, 'once');
    const envelope = (config['envelope'] || {}) as Record<string, any>;
    const sequenceA = (config['sequenceA'] || {}) as Record<string, any>;
    const instructingParty = (sequenceA['instructingParty'] || {}) as Record<string, any>;
    const orderingCustomer = (sequenceA['orderingCustomer'] || {}) as Record<string, any>;
    const accountServicing = (sequenceA['accountServicingInstitution'] || {}) as Record<string, any>;
    const mappings = (config['transactionMappings'] || {}) as Record<string, any>;
    const amount = (mappings['amount'] || {}) as Record<string, any>;
    const transactionOrderingCustomer = (mappings['orderingCustomer'] || {}) as Record<string, any>;
    const transactionAccountServicing = (mappings['accountServicingInstitution'] || {}) as Record<string, any>;
    const beneficiary = (mappings['beneficiary'] || {}) as Record<string, any>;
    const accountWith = (mappings['accountWithInstitution'] || {}) as Record<string, any>;
    const split = (config['splitBy'] || {}) as Record<string, any>;
    const source = (config['source'] || {}) as Record<string, any>;

    return {
      ...runtime,
      executionMode: 'once',
      format: this.normalizeFormat(config['format']),
      debitAccountMode: this.normalizeDebitAccountMode(config['debitAccountMode'], orderingCustomer, transactionOrderingCustomer),
      envelope: {
        senderLt: String(envelope['senderLt'] || ''),
        receiverLt: String(envelope['receiverLt'] || ''),
        uetrStrategy: this.normalizeUetrStrategy(envelope['uetrStrategy']),
        priority: this.normalizePriority(envelope['priority']),
      },
      sequenceA: {
        sendersReferenceTemplate: String(sequenceA['sendersReferenceTemplate'] || sequenceA['sendersReference'] || ''),
        requestedExecutionDate: String(sequenceA['requestedExecutionDate'] || ''),
        instructingPartyOption: this.normalizeInstructingOption(instructingParty['option']),
        instructingPartyIdentifier: this.joinLines(instructingParty['nameAndAddress']),
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
        accountServicingOption: this.normalizeServicingOption(transactionAccountServicing['option']),
        accountServicingAccountField: String(transactionAccountServicing['accountField'] || ''),
        accountServicingBicField: String(transactionAccountServicing['bicField'] || ''),
        beneficiaryOption: this.normalizeBeneficiaryOption(beneficiary['option']),
        beneficiaryAccountField: String(beneficiary['accountField'] || ''),
        beneficiaryBicField: String(beneficiary['bicField'] || ''),
        beneficiaryNameAddressFields: this.joinLines(beneficiary['nameAndAddressFields']),
        accountWithBicField: String(accountWith['bicField'] || ''),
        remittanceInformationField: String(mappings['remittanceInformationField'] || ''),
        detailsOfChargesField: String(mappings['detailsOfChargesField'] || ''),
      },
      splitStrategy: this.normalizeSplitStrategy(split['strategy']),
      // El backend lo lee en el NIVEL SUPERIOR (Mt101BuildFromTableTaskProvider:196), no dentro de splitBy —
      // que ademas no lo lee nadie. Leerlo de splitBy daba SIEMPRE el default, y como toTaskPatch lo re-emite
      // arriba, guardar reescribia el limite real de transacciones por mensaje MT101. splitBy queda como lectura
      // legacy: es donde lo dejaron las configs guardadas por la version con el bug.
      maxTransactionsPerMessage:
        Number(config['maxTransactionsPerMessage'] ?? split['maxTransactionsPerMessage']) || DEFAULT_MAX_TRANSACTIONS,
      sourceTable: String(source['table'] || ''),
      sourceConnectionRef: String(config['connectionRef'] || ''),
      sourcePayloadColumn: String(source['payloadColumn'] || ''),
      sourceIdColumn: String(source['idColumn'] || ''),
      // Todo el objeto source MENOS lo que el form expone (table/payloadColumn/idColumn): scope del lote y
      // acotado del rebuild. Se preserva para que exponer la tabla no des-acote un rebuild selectivo.
      preservedSource: this.omitKeys(source, BUILD_SOURCE_EXPOSED_KEYS),
      preserved: this.preserveKeys(config, BUILD_PRESERVED_KEYS),
      preservedEnvelope: this.preserveKeys(envelope, BUILD_ENVELOPE_KEYS),
      preservedSequenceA: this.preserveKeys(sequenceA, BUILD_SEQUENCE_A_KEYS),
    };
  }

  toTaskPatch(draft: Mt101BuildTaskDraft): Partial<ProcessTaskFormModel> {
    // source = lo preservado (scope del lote + acotado del rebuild) + lo que el form gobierna (tabla/columnas).
    // Se OMITE si queda vacio para que el backend lo derive de la tarea de origen (comportamiento actual).
    const source = this.compactObject({
      ...draft.preservedSource,
      table: draft.sourceTable,
      payloadColumn: draft.sourcePayloadColumn,
      idColumn: draft.sourceIdColumn,
    } as Record<string, unknown>);
    const payload: Record<string, unknown> = this.withRuntime(
      {
        ...draft.preserved,
        ...(draft.sourceConnectionRef ? { connectionRef: draft.sourceConnectionRef } : {}),
        ...(Object.keys(source).length ? { source } : {}),
        format: draft.format,
        debitAccountMode: draft.debitAccountMode,
        envelope: {
          ...draft.preservedEnvelope,
          senderLt: draft.envelope.senderLt,
          receiverLt: draft.envelope.receiverLt,
          uetrStrategy: draft.envelope.uetrStrategy,
          priority: draft.envelope.priority,
        },
        sequenceA: {
          ...draft.preservedSequenceA,
          sendersReferenceTemplate: draft.sequenceA.sendersReferenceTemplate,
          requestedExecutionDate: draft.sequenceA.requestedExecutionDate,
          instructingParty: draft.debitAccountMode === 'subsidiary'
            ? this.compactObject({
                option: draft.sequenceA.instructingPartyOption || 'L',
                nameAndAddress: this.splitLines(draft.sequenceA.instructingPartyIdentifier),
              })
            : undefined,
          orderingCustomer: draft.debitAccountMode === 'singleDebit'
            ? this.partyConfig(
                draft.sequenceA.orderingCustomerOption,
                draft.sequenceA.orderingCustomerAccount,
                '',
                draft.sequenceA.orderingCustomerNameAddress,
              )
            : undefined,
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
          orderingCustomer: draft.debitAccountMode === 'singleDebit'
            ? undefined
            : this.compactObject({
                option: draft.transactionMappings.orderingCustomerOption || 'H',
                accountField: draft.transactionMappings.orderingCustomerAccountField,
                bicField: draft.transactionMappings.orderingCustomerBicField,
                nameAndAddressFields: this.splitLines(draft.transactionMappings.orderingCustomerNameAddressFields),
              }),
          accountServicingInstitution: draft.transactionMappings.accountServicingOption
            ? this.compactObject({
                option: draft.transactionMappings.accountServicingOption,
                accountField: draft.transactionMappings.accountServicingAccountField,
                bicField: draft.transactionMappings.accountServicingBicField,
              })
            : undefined,
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

  private normalizeDebitAccountMode(
    value: unknown,
    sequenceAOrdering: Record<string, any>,
    transactionOrdering: Record<string, any>,
  ): 'singleDebit' | 'multipleDebit' | 'subsidiary' {
    const v = String(value || '');
    if (v === 'multipleDebit' || v === 'subsidiary') {
      return v;
    }
    if (v === 'singleDebit') {
      return 'singleDebit';
    }
    const hasSequenceA = Boolean(sequenceAOrdering['account'] || sequenceAOrdering['bic'] || sequenceAOrdering['nameAndAddress']);
    const hasTransaction = Boolean(
      transactionOrdering['accountField'] ||
        transactionOrdering['bicField'] ||
        transactionOrdering['nameAndAddressFields'],
    );
    return !hasSequenceA && hasTransaction ? 'multipleDebit' : 'singleDebit';
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

  private normalizeInstructingOption(value: unknown): 'L' | '' {
    const v = String(value || '').toUpperCase();
    return v === 'L' ? 'L' : '';
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

  private partyConfig(option: string, account: string, bic: string, nameAndAddress: string): Record<string, unknown> | undefined {
    const payload = this.compactObject({
      option,
      account,
      bic,
      nameAndAddress: this.splitLines(nameAndAddress),
    });
    const hasValue = Boolean(payload['account'] || payload['bic'] || payload['nameAndAddress']);
    return hasValue ? payload : undefined;
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
