import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AppFeedbackService } from '@integration-hub/core/services';

import { PaymentValidationRuleApiService } from '../api/payment-validation-rule-api.service';
import { createPaymentRuleDraft } from '../models/payment-validation-rule.models';
import { PaymentValidationRulesPageComponent } from './payment-validation-rules-page';

describe('PaymentValidationRulesPageComponent', () => {
  let fixture: ComponentFixture<PaymentValidationRulesPageComponent>;
  let component: PaymentValidationRulesPageComponent;
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

  beforeEach(async () => {
    api = {
      list: vi.fn().mockReturnValue(of({ total: 1, items: [activeRule] })),
      create: vi.fn().mockReturnValue(of(activeRule)),
      update: vi.fn().mockReturnValue(of(activeRule)),
      setActive: vi.fn().mockReturnValue(of({ ...activeRule, active: false })),
      exportRuleSet: vi.fn().mockReturnValue(of([activeRule])),
      importRules: vi.fn().mockReturnValue(
        of({
          ruleSet: 'bank:BCP',
          imported: 1,
          replacedExisting: true,
        })
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

    await TestBed.configureTestingModule({
      imports: [PaymentValidationRulesPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: PaymentValidationRuleApiService, useValue: api },
        { provide: AppFeedbackService, useValue: feedback },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentValidationRulesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should load rules with the default filters', () => {
    expect(api.list).toHaveBeenCalledWith({
      ruleSet: 'bank:TEST',
      search: '',
      standard: 'SWIFT',
      appliesTo: 'MT101',
      status: 'ALL',
      page: 0,
      size: 10,
    });
    expect(component.rules()).toEqual([activeRule]);
    expect(component.totalLength()).toBe(1);
  });

  it('should reject invalid JSON predicate bodies before saving', async () => {
    component.patchDraft({
      predicateKind: 'FIELD_REQUIRED',
      predicateBody: '{invalid',
    });

    await component.save();

    expect(feedback.error).toHaveBeenCalledWith('paymentRules.invalidJson');
    expect(api.create).not.toHaveBeenCalled();
    expect(api.update).not.toHaveBeenCalled();
  });

  it('should require a second confirmation before replacing imports', async () => {
    component.ruleSetFilter.set('bank:BCP');
    component.replacingImport.set(true);
    component.importJson.set(JSON.stringify([createPaymentRuleDraft('bank:BCP')]));

    await component.importRules();

    expect(component.armed()).toBe(component.importArmedId);
    expect(api.importRules).not.toHaveBeenCalled();

    await component.importRules();

    expect(api.importRules).toHaveBeenCalledWith({
      ruleSet: 'bank:BCP',
      replaceExisting: true,
      rules: [createPaymentRuleDraft('bank:BCP')],
    });
    expect(feedback.info).toHaveBeenCalledWith('paymentRules.importSuccess', {
      count: 1,
    });
  });

  it('should arm destructive toggles for error severity rules', async () => {
    await component.toggle(activeRule);

    expect(component.armed()).toBe('rule:toggle:E:17');
    expect(api.setActive).not.toHaveBeenCalled();

    await component.toggle(activeRule);

    expect(api.setActive).toHaveBeenCalledWith(17, false);
    expect(feedback.deactivated).toHaveBeenCalledWith('paymentRules.ruleEntity');
  });
});
