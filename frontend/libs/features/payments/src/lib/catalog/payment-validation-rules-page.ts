import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppFeedbackService, I18nService } from '@integration-hub/core/services';
import { ActionDispatcherService, IconComponent } from '@integration-hub/shared/ui';
import { firstValueFrom } from 'rxjs';

import { PaymentValidationRuleApiService } from '../api/payment-validation-rule-api.service';
import {
  PaymentRulePredicateKind,
  PaymentRuleSeverity,
  PaymentValidationRuleDraft,
  PaymentValidationRuleImportResponse,
  PaymentValidationRuleRecord,
  createPaymentRuleDraft,
  toPaymentRuleDraft,
} from '../models/payment-validation-rule.models';

interface SeverityPresentation {
  labelKey: string;
  chipClass: string;
}

const SEVERITY_PRESENTATION: Record<PaymentRuleSeverity, SeverityPresentation> = {
  E: { labelKey: 'paymentRules.severityError', chipClass: 'severity-ch--error' },
  W: { labelKey: 'paymentRules.severityWarn', chipClass: 'severity-ch--warn' },
  I: { labelKey: 'paymentRules.severityInfo', chipClass: 'severity-ch--info' },
};

const SEVERITY_IDS: Record<PaymentRuleSeverity, string> = {
  E: 'rule:toggle:E',
  W: 'rule:toggle:W',
  I: 'rule:toggle:I',
};

function toggleActionId(rule: PaymentValidationRuleRecord): string {
  return `${SEVERITY_IDS[rule.severity]}:${rule.id}`;
}

function resolveSeverityChipClass(severity: PaymentRuleSeverity): string {
  return SEVERITY_PRESENTATION[severity].chipClass;
}

const SEVERITY_VALUES: readonly PaymentRuleSeverity[] = ['E', 'W', 'I'];

function validatePredicateBody(body: string, kind: PaymentRulePredicateKind): boolean {
  if (!body.trim()) {
    return true;
  }
  if (kind === 'JEXL') {
    return true;
  }
  try {
    JSON.parse(body);
    return true;
  } catch {
    return false;
  }
}

function parseImportJson(raw: string): PaymentValidationRuleDraft[] | null {
  if (!raw.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed as PaymentValidationRuleDraft[];
  } catch {
    return null;
  }
}

@Component({
  selector: 'ih-payment-validation-rules-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
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
export class PaymentValidationRulesPageComponent implements OnInit, OnDestroy {
  readonly i18n = inject(I18nService);
  private readonly api = inject(PaymentValidationRuleApiService);
  private readonly dispatcher = inject(ActionDispatcherService);
  private readonly feedback = inject(AppFeedbackService);

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
  readonly severityValues = SEVERITY_VALUES;

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

  readonly armed = this.dispatcher.armed;
  readonly saveArmedId = 'rule:save:overwrite';
  readonly importArmedId = 'rule:import:replace';

  readonly editing = computed(() => this.draft().id != null);
  readonly predicateValid = computed(() =>
    validatePredicateBody(this.draft().predicateBody, this.draft().predicateKind)
  );
  readonly importParsed = computed(() => parseImportJson(this.importJson()));
  readonly importPreviewCount = computed(() => {
    const parsed = this.importParsed();
    return parsed ? parsed.length : 0;
  });
  readonly importJsonValid = computed(() => {
    const raw = this.importJson().trim();
    if (!raw) {
      return true;
    }
    return this.importParsed() !== null;
  });

  private debounceTimer?: ReturnType<typeof setTimeout>;

  severityLabel(severity: PaymentRuleSeverity): string {
    return this.i18n.t(SEVERITY_PRESENTATION[severity].labelKey);
  }

  severityChipClass(severity: PaymentRuleSeverity): string {
    return resolveSeverityChipClass(severity);
  }

  ngOnInit(): void {
    void this.load();
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.dispatcher.disarm();
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
    } catch (error) {
      this.feedback.handleHttpError(error as HttpErrorResponse);
    } finally {
      this.loading.set(false);
    }
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    void this.load(false);
  }

  setFilter(key: 'ruleSetFilter' | 'search' | 'standardFilter' | 'appliesToFilter', value: string): void {
    this[key].set(value);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => void this.load(true), 300);
  }

  setStatusFilter(value: string): void {
    this.statusFilter.set(value);
    void this.load(true);
  }

  newRule(): void {
    this.selected.set(null);
    this.draft.set(createPaymentRuleDraft(this.ruleSetFilter() || 'bank:TEST'));
    this.dispatcher.disarm();
  }

  edit(rule: PaymentValidationRuleRecord): void {
    this.selected.set(rule);
    this.draft.set(toPaymentRuleDraft(rule));
    this.dispatcher.disarm();
  }

  clone(rule: PaymentValidationRuleRecord): void {
    const cloned = toPaymentRuleDraft(rule);
    cloned.id = null;
    cloned.code = rule.code + '-copy';
    this.selected.set(null);
    this.draft.set(cloned);
    this.dispatcher.disarm();
  }

  patchDraft(patch: Partial<PaymentValidationRuleDraft>): void {
    this.draft.set({ ...this.draft(), ...patch });
  }

  formatPredicateBody(): void {
    const body = this.draft().predicateBody;
    if (!body.trim() || this.draft().predicateKind === 'JEXL') {
      return;
    }
    try {
      const parsed = JSON.parse(body);
      this.patchDraft({ predicateBody: JSON.stringify(parsed, null, 2) });
    } catch {
      this.feedback.error('paymentRules.invalidJson');
    }
  }

  async save(): Promise<void> {
    if (!this.predicateValid()) {
      this.feedback.error('paymentRules.invalidJson');
      return;
    }
    const value = this.draft();
    if (this.editing()) {
      if (this.dispatcher.dispatch({ id: this.saveArmedId, severity: 'warning' })) {
        await this.doSave(value);
      }
      return;
    }
    await this.doSave(value);
  }

  private async doSave(value: PaymentValidationRuleDraft): Promise<void> {
    try {
      if (value.id == null) {
        await firstValueFrom(this.api.create(value));
        this.feedback.created('paymentRules.ruleEntity');
      } else {
        await firstValueFrom(this.api.update(value.id, value));
        this.feedback.updated('paymentRules.ruleEntity');
      }
      this.ruleSetFilter.set(value.ruleSet);
      await this.load(true);
      this.newRule();
    } catch (error) {
      this.feedback.handleHttpError(error as HttpErrorResponse);
    }
  }

  async toggle(rule: PaymentValidationRuleRecord): Promise<void> {
    if (rule.severity === 'E') {
      const actionId = toggleActionId(rule);
      if (rule.active) {
        if (!this.dispatcher.dispatch({ id: actionId, severity: 'danger' })) {
          return;
        }
      } else {
        if (!this.dispatcher.dispatch({ id: actionId, severity: 'warning' })) {
          return;
        }
      }
    }
    try {
      await firstValueFrom(this.api.setActive(rule.id, !rule.active));
      if (rule.active) {
        this.feedback.deactivated('paymentRules.ruleEntity');
      } else {
        this.feedback.activated('paymentRules.ruleEntity');
      }
      await this.load(false);
    } catch (error) {
      this.feedback.handleHttpError(error as HttpErrorResponse);
    } finally {
      this.dispatcher.disarm();
    }
  }

  async exportCurrentRuleSet(): Promise<void> {
    const ruleSet = this.ruleSetFilter().trim();
    if (!ruleSet) {
      return;
    }
    try {
      const exported = await firstValueFrom(this.api.exportRuleSet(ruleSet));
      this.exportJson.set(JSON.stringify(exported, null, 2));
    } catch (error) {
      this.feedback.handleHttpError(error as HttpErrorResponse);
    }
  }

  downloadExport(): void {
    const json = this.exportJson();
    if (!json) {
      return;
    }
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-rules-${this.ruleSetFilter() || 'export'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  copyExport(): void {
    const json = this.exportJson();
    if (!json) {
      return;
    }
    navigator.clipboard?.writeText(json).then(
      () => this.feedback.info('paymentRules.copyJson'),
      () => this.feedback.errorMessage('Clipboard write failed')
    );
  }

  async importRules(): Promise<void> {
    const raw = this.importJson().trim();
    if (!raw) {
      return;
    }
    const parsed = parseImportJson(raw);
    if (parsed === null) {
      this.feedback.error('paymentRules.importInvalidJson');
      return;
    }
    if (this.replacingImport()) {
      if (!this.dispatcher.dispatch({ id: this.importArmedId, severity: 'danger' })) {
        return;
      }
    }
    try {
      const response: PaymentValidationRuleImportResponse = await firstValueFrom(
        this.api.importRules({
          ruleSet: this.ruleSetFilter(),
          replaceExisting: this.replacingImport(),
          rules: parsed,
        })
      );
      this.feedback.info('paymentRules.importSuccess', { count: response.imported });
      this.importJson.set('');
      await this.load(true);
    } catch (error) {
      this.feedback.handleHttpError(error as HttpErrorResponse);
    } finally {
      this.dispatcher.disarm();
    }
  }

  cancelEdit(): void {
    this.newRule();
  }
}
