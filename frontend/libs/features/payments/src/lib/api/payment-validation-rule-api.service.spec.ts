import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { createPaymentRuleDraft } from '../models/payment-validation-rule.models';
import { PaymentValidationRuleApiService } from './payment-validation-rule-api.service';

describe('PaymentValidationRuleApiService', () => {
  let service: PaymentValidationRuleApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PaymentValidationRuleApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(PaymentValidationRuleApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should build list query params without forwarding ALL status', () => {
    service
      .list({
        ruleSet: ' bank:BCP ',
        search: ' AMOUNT ',
        standard: 'SWIFT',
        appliesTo: 'MT101',
        status: 'ALL',
        page: 2,
        size: 25,
      })
      .subscribe();

    const request = httpTesting.expectOne((candidate) => {
      const params = candidate.params;
      return (
        candidate.method === 'GET' &&
        candidate.url === '/api/payment-validation-rules' &&
        params.get('ruleSet') === 'bank:BCP' &&
        params.get('q') === 'AMOUNT' &&
        params.get('standard') === 'SWIFT' &&
        params.get('appliesTo') === 'MT101' &&
        params.get('page') === '2' &&
        params.get('size') === '25' &&
        !params.has('status')
      );
    });
    request.flush({ total: 0, items: [] });
  });

  it('should call activation endpoint with the target state', () => {
    service.setActive(17, false).subscribe();

    const request = httpTesting.expectOne(
      '/api/payment-validation-rules/17/activation/false'
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({ ...createPaymentRuleDraft(), id: 17, active: false });
  });

  it('should import rules for the selected rule set', () => {
    const rule = createPaymentRuleDraft('bank:BCP');

    service
      .importRules({
        ruleSet: 'bank:BCP',
        replaceExisting: true,
        rules: [rule],
      })
      .subscribe();

    const request = httpTesting.expectOne(
      '/api/payment-validation-rules/import'
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      ruleSet: 'bank:BCP',
      replaceExisting: true,
      rules: [rule],
    });
    request.flush({
      ruleSet: 'bank:BCP',
      imported: 1,
      replacedExisting: true,
    });
  });
});
