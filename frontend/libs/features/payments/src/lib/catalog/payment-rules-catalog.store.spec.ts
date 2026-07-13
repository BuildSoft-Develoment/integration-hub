import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AppFeedbackService } from '@integration-hub/core/services';
import { ActionDispatcherService } from '@integration-hub/shared/ui';

import { PaymentValidationRuleApiService } from '../api/payment-validation-rule-api.service';
import { createPaymentRuleDraft } from '../models/payment-validation-rule.models';
import { PaymentRulesCatalogStore } from './payment-rules-catalog.store';

describe('PaymentRulesCatalogStore', () => {
  let store: PaymentRulesCatalogStore;
  let api: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    setActive: ReturnType<typeof vi.fn>;
    exportRuleSet: ReturnType<typeof vi.fn>;
    importRules: ReturnType<typeof vi.fn>;
  };
  let feedback: {
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    created: ReturnType<typeof vi.fn>;
    updated: ReturnType<typeof vi.fn>;
    activated: ReturnType<typeof vi.fn>;
    deactivated: ReturnType<typeof vi.fn>;
    handleHttpError: ReturnType<typeof vi.fn>;
  };

  const activeRule = {
    ...createPaymentRuleDraft('bank:BCP'),
    id: 17,
    code: 'AMOUNT_REQUIRED',
    active: true,
  };

  beforeEach(() => {
    api = {
      list: vi.fn().mockReturnValue(of({ total: 1, items: [activeRule] })),
      create: vi.fn().mockReturnValue(of(activeRule)),
      update: vi.fn().mockReturnValue(of(activeRule)),
      setActive: vi.fn().mockReturnValue(of({ ...activeRule, active: false })),
      exportRuleSet: vi.fn().mockReturnValue(of([activeRule])),
      importRules: vi.fn().mockReturnValue(
        of({ ruleSet: 'bank:BCP', imported: 1, replacedExisting: true })
      ),
    };
    feedback = {
      error: vi.fn(),
      info: vi.fn(),
      created: vi.fn(),
      updated: vi.fn(),
      activated: vi.fn(),
      deactivated: vi.fn(),
      handleHttpError: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PaymentRulesCatalogStore,
        ActionDispatcherService,
        { provide: PaymentValidationRuleApiService, useValue: api },
        { provide: AppFeedbackService, useValue: feedback },
      ],
    });
    store = TestBed.inject(PaymentRulesCatalogStore);
  });

  it('should load rules with the default filters', async () => {
    await store.load();

    expect(api.list).toHaveBeenCalledWith({
      ruleSet: 'bank:TEST',
      search: '',
      standard: 'SWIFT',
      appliesTo: 'MT101',
      status: 'ALL',
      page: 0,
      size: 10,
    });
    expect(store.rules()).toEqual([activeRule]);
    expect(store.totalLength()).toBe(1);
  });

  it('should reject invalid JSON predicate bodies before saving', async () => {
    store.patchDraft({ predicateKind: 'FIELD_REQUIRED', predicateBody: '{invalid' });

    await store.save();

    expect(feedback.error).toHaveBeenCalledWith('paymentRules.invalidJson');
    expect(api.create).not.toHaveBeenCalled();
    expect(api.update).not.toHaveBeenCalled();
  });

  it('should require a second confirmation before replacing imports', async () => {
    store.ruleSetFilter.set('bank:BCP');
    store.replacingImport.set(true);
    store.importJson.set(JSON.stringify([createPaymentRuleDraft('bank:BCP')]));

    await store.importRules();

    expect(store.armed()).toBe(store.importArmedId);
    expect(api.importRules).not.toHaveBeenCalled();

    await store.importRules();

    expect(api.importRules).toHaveBeenCalledWith({
      ruleSet: 'bank:BCP',
      replaceExisting: true,
      rules: [createPaymentRuleDraft('bank:BCP')],
    });
    expect(feedback.info).toHaveBeenCalledWith('paymentRules.importSuccess', { count: 1 });
  });

  it('should arm destructive toggles for error severity rules', async () => {
    await store.toggle(activeRule);

    expect(store.armed()).toBe('rule:toggle:E:17');
    expect(api.setActive).not.toHaveBeenCalled();

    await store.toggle(activeRule);

    expect(api.setActive).toHaveBeenCalledWith(17, false);
    expect(feedback.deactivated).toHaveBeenCalledWith('paymentRules.ruleEntity');
  });
});
