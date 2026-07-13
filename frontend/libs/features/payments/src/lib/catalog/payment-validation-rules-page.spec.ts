import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AppFeedbackService } from '@integration-hub/core/services';

import { PaymentValidationRuleApiService } from '../api/payment-validation-rule-api.service';
import { createPaymentRuleDraft } from '../models/payment-validation-rule.models';
import { PaymentValidationRulesPageComponent } from './payment-validation-rules-page';

/**
 * Smoke test del page shell refactorizado (grid + toolbar + list + editor en drawer): al montar renderiza todo el
 * árbol de presentación y dispara la carga inicial vía el store. La lógica detallada se cubre en
 * payment-rules-catalog.store.spec.ts.
 */
describe('PaymentValidationRulesPageComponent', () => {
  let fixture: ComponentFixture<PaymentValidationRulesPageComponent>;
  let api: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    setActive: ReturnType<typeof vi.fn>;
    exportRuleSet: ReturnType<typeof vi.fn>;
    importRules: ReturnType<typeof vi.fn>;
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
      importRules: vi.fn().mockReturnValue(of({ ruleSet: 'bank:BCP', imported: 1, replacedExisting: true })),
    };

    await TestBed.configureTestingModule({
      imports: [PaymentValidationRulesPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: PaymentValidationRuleApiService, useValue: api },
        {
          provide: AppFeedbackService,
          useValue: {
            error: vi.fn(),
            info: vi.fn(),
            created: vi.fn(),
            updated: vi.fn(),
            activated: vi.fn(),
            deactivated: vi.fn(),
            handleHttpError: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentValidationRulesPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders the catalog shell and loads rules on init', () => {
    expect(api.list).toHaveBeenCalledWith({
      ruleSet: 'bank:TEST',
      search: '',
      standard: 'SWIFT',
      appliesTo: 'MT101',
      status: 'ALL',
      page: 0,
      size: 10,
    });
    expect(fixture.componentInstance.store.rules()).toEqual([activeRule]);
  });
});
