import { describe, expect, it } from 'vitest';
import { Mt101BuildTaskProvider, Mt101BuildTaskDraft } from './mt101-build-task.provider';
import { ProcessTaskFormModel } from '../../tasks/process-task.models';

const baseTask: ProcessTaskFormModel = {
  clientId: 'client-1',
  id: null,
  taskOrder: 3,
  taskType: 'MT101_BUILD',
  active: true,
  sourceDefinitionId: null,
  readerDefinitionId: null,
  configurationJson: '{}',
};

describe('Mt101BuildTaskProvider', () => {
  describe('descriptor', () => {
    it('declares MT101_BUILD as type and workspace layout', () => {
      const provider = new Mt101BuildTaskProvider();
      expect(provider.descriptor.type).toBe('MT101_BUILD');
      expect(provider.descriptor.modalLayout).toBe('workspace');
      expect(provider.descriptor.labelKey).toBe('processTask.MT101_BUILD');
    });
  });

  describe('createDraft', () => {
    it('returns sensible defaults for a new task', () => {
      const draft = new Mt101BuildTaskProvider().createDraft();
      expect(draft.executionMode).toBe('once');
      expect(draft.format).toBe('JSON');
      expect(draft.debitAccountMode).toBe('singleDebit');
      expect(draft.envelope.uetrStrategy).toBe('perMessage');
      expect(draft.envelope.priority).toBe('N');
      expect(draft.sequenceA.orderingCustomerOption).toBe('H');
      expect(draft.sequenceA.sendersReferenceTemplate).toContain('${_processExecutionId}');
      expect(draft.transactionMappings.transactionReferenceTemplate).toContain('${recordNumber}');
      expect(draft.splitStrategy).toBe('none');
    });
  });

  describe('toTaskPatch', () => {
    it('serializes draft to compact configuration_json without empty objects', () => {
      const provider = new Mt101BuildTaskProvider();
      const draft: Mt101BuildTaskDraft = {
        ...provider.createDraft(),
        taskRef: 'build-mt101',
        format: 'XML',
        envelope: {
          senderLt: 'SGOBFRPPAXXX',
          receiverLt: 'BCPLPEPLXXXX',
          uetrStrategy: 'perMessage',
          priority: 'N',
        },
        sequenceA: {
          sendersReferenceTemplate: 'PROC-${_processExecutionId}',
          requestedExecutionDate: '${today+1bd}',
          instructingPartyOption: '',
          instructingPartyIdentifier: '',
          orderingCustomerOption: 'H',
          orderingCustomerAccount: '001-10200200',
          orderingCustomerNameAddress: 'ACME SAC\nLIMA PE',
          accountServicingOption: 'A',
          accountServicingBic: 'BCPLPEPLXXX',
        },
        transactionMappings: {
          ...provider.createDraft().transactionMappings,
          amountCurrencyField: 'moneda',
          amountValueField: 'monto',
          orderingCustomerOption: 'H',
          orderingCustomerAccountField: 'cuenta_ordenante',
          orderingCustomerNameAddressFields: 'nombre_ordenante\nciudad_ordenante',
          beneficiaryAccountField: 'cuenta_beneficiario',
          accountWithBicField: 'bic_beneficiario',
          remittanceInformationField: 'concepto',
          detailsOfChargesField: 'cargos',
        },
      };

      const patch = provider.toTaskPatch(draft);
      const config = JSON.parse(patch.configurationJson as string);
      expect(config.taskRef).toBe('build-mt101');
      expect(config.executionMode).toBe('once');
      expect(config.format).toBe('XML');
      expect(config.debitAccountMode).toBe('singleDebit');
      expect(config.envelope).toEqual({
        senderLt: 'SGOBFRPPAXXX',
        receiverLt: 'BCPLPEPLXXXX',
        uetrStrategy: 'perMessage',
        priority: 'N',
      });
      expect(config.sequenceA.orderingCustomer).toEqual({
        option: 'H',
        account: '001-10200200',
        nameAndAddress: ['ACME SAC', 'LIMA PE'],
      });
      expect(config.sequenceA.accountServicingInstitution).toEqual({
        option: 'A',
        bic: 'BCPLPEPLXXX',
      });
      expect(config.transactionMappings.amount).toEqual({ currencyField: 'moneda', valueField: 'monto' });
      expect(config.transactionMappings.orderingCustomer).toBeUndefined();
      expect(config.transactionMappings.beneficiary).toEqual({
        accountField: 'cuenta_beneficiario',
      });
      expect(config.transactionMappings.accountWithInstitution).toEqual({
        option: 'A',
        bicField: 'bic_beneficiario',
      });
      expect(config.splitBy.strategy).toBe('none');
      expect(config.splitBy.rebuildIndexTotal).toBe(true);
    });

    it('serializes transaction ordering customer only for multiple debit mode', () => {
      const provider = new Mt101BuildTaskProvider();
      const draft: Mt101BuildTaskDraft = {
        ...provider.createDraft(),
        taskRef: 'build-mt101',
        debitAccountMode: 'multipleDebit',
        sequenceA: {
          ...provider.createDraft().sequenceA,
          orderingCustomerAccount: 'SHOULD-NOT-BE-SERIALIZED',
        },
        transactionMappings: {
          ...provider.createDraft().transactionMappings,
          amountCurrencyField: 'moneda',
          amountValueField: 'monto',
          orderingCustomerOption: 'H',
          orderingCustomerAccountField: 'cuenta_ordenante',
          orderingCustomerNameAddressFields: 'nombre_ordenante',
          beneficiaryAccountField: 'cuenta_beneficiario',
        },
      };

      const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
      expect(config.debitAccountMode).toBe('multipleDebit');
      expect(config.sequenceA.orderingCustomer).toBeUndefined();
      expect(config.transactionMappings.orderingCustomer).toEqual({
        option: 'H',
        accountField: 'cuenta_ordenante',
        nameAndAddressFields: ['nombre_ordenante'],
      });
    });

    it('omits accountServicingInstitution when no option chosen', () => {
      const provider = new Mt101BuildTaskProvider();
      const draft = provider.createDraft();
      draft.taskRef = 'build-mt101';
      const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
      expect(config.sequenceA.accountServicingInstitution).toBeUndefined();
    });
  });

  describe('hydrateDraft -> toTaskPatch roundtrip', () => {
    it('preserves all configured fields across roundtrip', () => {
      const provider = new Mt101BuildTaskProvider();
      const initialDraft: Mt101BuildTaskDraft = {
        ...provider.createDraft(),
        taskRef: 'build-mt101',
        debitAccountMode: 'multipleDebit',
        format: 'FIN',
        envelope: {
          senderLt: 'AAAA',
          receiverLt: 'BBBB',
          uetrStrategy: 'fixed',
          priority: 'U',
        },
        sequenceA: {
          sendersReferenceTemplate: 'PROC-X',
          requestedExecutionDate: '2026-06-09',
          instructingPartyOption: '',
          instructingPartyIdentifier: '',
          orderingCustomerOption: 'H',
          orderingCustomerAccount: '',
          orderingCustomerNameAddress: '',
          accountServicingOption: 'C',
          accountServicingBic: 'BCBC',
        },
        transactionMappings: {
          transactionReferenceTemplate: 'TX-${dni}',
          amountCurrencyField: 'moneda',
          amountValueField: 'monto',
          orderingCustomerOption: 'F',
          orderingCustomerAccountField: 'cuenta_ordenante',
          orderingCustomerBicField: 'bic_ord',
          orderingCustomerNameAddressFields: 'nombre_ordenante\ndni_ordenante',
          accountServicingOption: 'A',
          accountServicingAccountField: '',
          accountServicingBicField: 'bic_servicing',
          beneficiaryOption: 'F',
          beneficiaryAccountField: 'cuenta',
          beneficiaryBicField: 'bic_ben',
          beneficiaryNameAddressFields: 'nombre\ndni',
          accountWithBicField: 'bic_acc',
          remittanceInformationField: 'concepto',
          detailsOfChargesField: 'cargos',
        },
        splitStrategy: 'debitAccount',
        maxTransactionsPerMessage: 100,
      };

      const patch = provider.toTaskPatch(initialDraft);
      const taskAfterPersist: ProcessTaskFormModel = {
        ...baseTask,
        configurationJson: patch.configurationJson as string,
      };

      const rehydrated = provider.hydrateDraft(taskAfterPersist);
      expect(rehydrated.taskRef).toBe('build-mt101');
      expect(rehydrated.debitAccountMode).toBe('multipleDebit');
      expect(rehydrated.format).toBe('FIN');
      expect(rehydrated.envelope).toEqual(initialDraft.envelope);
      expect(rehydrated.sequenceA).toEqual(initialDraft.sequenceA);
      expect(rehydrated.transactionMappings).toEqual(initialDraft.transactionMappings);
      expect(rehydrated.splitStrategy).toBe('debitAccount');
      expect(rehydrated.maxTransactionsPerMessage).toBe(100);
    });
  });

  describe('subsidiary and transaction servicing mappings', () => {
    it('serializes instructing party and per-transaction servicing bank', () => {
      const provider = new Mt101BuildTaskProvider();
      const draft: Mt101BuildTaskDraft = {
        ...provider.createDraft(),
        taskRef: 'build-subs',
        debitAccountMode: 'subsidiary',
        sequenceA: {
          ...provider.createDraft().sequenceA,
          instructingPartyOption: 'L',
          instructingPartyIdentifier: 'GRUPO MATRIZ',
          orderingCustomerAccount: 'SHOULD-NOT-BE-SERIALIZED',
        },
        transactionMappings: {
          ...provider.createDraft().transactionMappings,
          amountCurrencyField: 'moneda',
          amountValueField: 'monto',
          orderingCustomerOption: 'H',
          orderingCustomerAccountField: 'cuenta_subsidiaria',
          orderingCustomerNameAddressFields: 'nombre_subsidiaria',
          accountServicingOption: 'A',
          accountServicingBicField: 'bic_banco_debito',
          beneficiaryAccountField: 'cuenta_beneficiario',
        },
      };

      const config = JSON.parse(provider.toTaskPatch(draft).configurationJson as string);
      expect(config.sequenceA.instructingParty).toEqual({
        option: 'L',
        nameAndAddress: ['GRUPO MATRIZ'],
      });
      expect(config.sequenceA.orderingCustomer).toBeUndefined();
      expect(config.transactionMappings.accountServicingInstitution).toEqual({
        option: 'A',
        bicField: 'bic_banco_debito',
      });
    });
  });

  describe('hydrateDraft validation', () => {
    it('falls back to defaults for malformed configuration', () => {
      const provider = new Mt101BuildTaskProvider();
      const draft = provider.hydrateDraft({ ...baseTask, configurationJson: 'not-json' });
      expect(draft.format).toBe('JSON');
      expect(draft.envelope.uetrStrategy).toBe('perMessage');
      expect(draft.envelope.priority).toBe('N');
    });

    it('normalizes invalid enum values to safe defaults', () => {
      const provider = new Mt101BuildTaskProvider();
      const config = JSON.stringify({
        taskRef: 'x',
        executionMode: 'once',
        format: 'PDF',
        envelope: { uetrStrategy: 'bogus', priority: 'Z' },
        sequenceA: { orderingCustomer: { option: 'INVALID' } },
        transactionMappings: { beneficiary: { option: 'BOGUS' } },
        splitBy: { strategy: 'mystery' },
      });
      const draft = provider.hydrateDraft({ ...baseTask, configurationJson: config });
      expect(draft.format).toBe('JSON');
      expect(draft.envelope.uetrStrategy).toBe('perMessage');
      expect(draft.envelope.priority).toBe('N');
      expect(draft.sequenceA.orderingCustomerOption).toBe('H');
      expect(draft.transactionMappings.beneficiaryOption).toBe('');
      expect(draft.splitStrategy).toBe('none');
    });
  });
});
