import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  PaymentValidationRuleDraft,
  PaymentValidationRuleImportPayload,
  PaymentValidationRuleImportResponse,
  PaymentValidationRulePageResponse,
  PaymentValidationRuleRecord,
} from '../models/payment-validation-rule.models';

export interface PaymentValidationRuleQueryParams {
  ruleSet?: string;
  search?: string;
  standard?: string;
  appliesTo?: string;
  status?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class PaymentValidationRuleApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/payment-validation-rules';

  list(params: PaymentValidationRuleQueryParams): Observable<PaymentValidationRulePageResponse> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 10));

    if (params.ruleSet?.trim()) {
      httpParams = httpParams.set('ruleSet', params.ruleSet.trim());
    }
    if (params.search?.trim()) {
      httpParams = httpParams.set('q', params.search.trim());
    }
    if (params.standard?.trim()) {
      httpParams = httpParams.set('standard', params.standard.trim());
    }
    if (params.appliesTo?.trim()) {
      httpParams = httpParams.set('appliesTo', params.appliesTo.trim());
    }
    if (params.status && params.status !== 'ALL') {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http.get<PaymentValidationRulePageResponse>(this.baseUrl, {
      params: httpParams,
    });
  }

  create(payload: PaymentValidationRuleDraft): Observable<PaymentValidationRuleRecord> {
    return this.http.post<PaymentValidationRuleRecord>(this.baseUrl, payload);
  }

  update(ruleId: number, payload: PaymentValidationRuleDraft): Observable<PaymentValidationRuleRecord> {
    return this.http.put<PaymentValidationRuleRecord>(`${this.baseUrl}/${ruleId}`, payload);
  }

  setActive(ruleId: number, active: boolean): Observable<PaymentValidationRuleRecord> {
    return this.http.post<PaymentValidationRuleRecord>(
      `${this.baseUrl}/${ruleId}/activation/${active}`,
      {}
    );
  }

  exportRuleSet(ruleSet: string): Observable<PaymentValidationRuleRecord[]> {
    return this.http.get<PaymentValidationRuleRecord[]>(`${this.baseUrl}/export`, {
      params: new HttpParams().set('ruleSet', ruleSet),
    });
  }

  importRules(payload: PaymentValidationRuleImportPayload): Observable<PaymentValidationRuleImportResponse> {
    return this.http.post<PaymentValidationRuleImportResponse>(`${this.baseUrl}/import`, payload);
  }
}
