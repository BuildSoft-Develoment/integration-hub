import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { I18nService } from '@integration-hub/core/services';
import { IconComponent } from '@integration-hub/shared/ui';
import { firstValueFrom } from 'rxjs';

import { PaymentValidationRuleApiService } from '../api/payment-validation-rule-api.service';
import {
  PaymentRulePredicateKind,
  PaymentRuleSeverity,
  PaymentValidationRuleDraft,
  PaymentValidationRuleRecord,
  createPaymentRuleDraft,
  toPaymentRuleDraft,
} from '../models/payment-validation-rule.models';

@Component({
  selector: 'ih-payment-validation-rules-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTableModule,
    MatTooltipModule,
    IconComponent,
  ],
  templateUrl: './payment-validation-rules-page.html',
  styleUrl: './payment-validation-rules-page.css',
})
export class PaymentValidationRulesPageComponent implements OnInit {
  readonly i18n = inject(I18nService);
  private readonly api = inject(PaymentValidationRuleApiService);

  readonly displayedColumns = ['ruleSet', 'code', 'predicateKind', 'severity', 'status', 'actions'];
  readonly predicateKinds: readonly PaymentRulePredicateKind[] = [
    'FIELD_REQUIRED',
    'FIELD_FORBIDDEN',
    'OPTION_ALLOWED',
    'MAX_LENGTH',
    'CURRENCY_ALLOWED',
    'AMOUNT_MAX',
    'CHARGES_ALLOWED',
    'JEXL',
  ];
  readonly severities: readonly PaymentRuleSeverity[] = ['E', 'W', 'I'];

  readonly loading = signal(false);
  readonly rules = signal<PaymentValidationRuleRecord[]>([]);
  readonly totalLength = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly selected = signal<PaymentValidationRuleRecord | null>(null);
  readonly draft = signal<PaymentValidationRuleDraft>(createPaymentRuleDraft());
  readonly importJson = signal('');
  readonly exportJson = signal('');

  readonly ruleSetFilter = signal('bank:TEST');
  readonly search = signal('');
  readonly standardFilter = signal('SWIFT');
  readonly appliesToFilter = signal('MT101');
  readonly statusFilter = signal('ALL');
  readonly replacingImport = signal(false);

  readonly editing = computed(() => this.draft().id != null);

  ngOnInit(): void {
    void this.load();
  }

  async load(resetPage = false): Promise<void> {
    if (resetPage) {
      this.pageIndex.set(0);
    }
    this.loading.set(true);
    try {
      const response = await firstValueFrom(
        this.api.list({
          ruleSet: this.ruleSetFilter(),
          search: this.search(),
          standard: this.standardFilter(),
          appliesTo: this.appliesToFilter(),
          status: this.statusFilter(),
          page: this.pageIndex(),
          size: this.pageSize(),
        })
      );
      this.rules.set(response.items);
      this.totalLength.set(response.total);
    } finally {
      this.loading.set(false);
    }
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    void this.load(false);
  }

  newRule(): void {
    this.selected.set(null);
    this.draft.set(createPaymentRuleDraft(this.ruleSetFilter() || 'bank:TEST'));
  }

  edit(rule: PaymentValidationRuleRecord): void {
    this.selected.set(rule);
    this.draft.set(toPaymentRuleDraft(rule));
  }

  patchDraft(patch: Partial<PaymentValidationRuleDraft>): void {
    this.draft.set({ ...this.draft(), ...patch });
  }

  async save(): Promise<void> {
    const value = this.draft();
    if (value.id == null) {
      await firstValueFrom(this.api.create(value));
    } else {
      await firstValueFrom(this.api.update(value.id, value));
    }
    this.ruleSetFilter.set(value.ruleSet);
    await this.load(true);
    this.newRule();
  }

  async toggle(rule: PaymentValidationRuleRecord): Promise<void> {
    await firstValueFrom(this.api.setActive(rule.id, !rule.active));
    await this.load(false);
  }

  async exportCurrentRuleSet(): Promise<void> {
    const ruleSet = this.ruleSetFilter().trim();
    if (!ruleSet) {
      return;
    }
    const exported = await firstValueFrom(this.api.exportRuleSet(ruleSet));
    this.exportJson.set(JSON.stringify(exported, null, 2));
  }

  async importRules(): Promise<void> {
    const raw = this.importJson().trim();
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw) as PaymentValidationRuleDraft[];
    await firstValueFrom(
      this.api.importRules({
        ruleSet: this.ruleSetFilter(),
        replaceExisting: this.replacingImport(),
        rules: parsed,
      })
    );
    this.importJson.set('');
    await this.load(true);
  }
}
