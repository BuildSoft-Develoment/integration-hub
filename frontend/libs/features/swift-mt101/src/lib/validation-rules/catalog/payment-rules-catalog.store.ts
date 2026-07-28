import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { AppFeedbackService } from '@integration-hub/core/services';
import { ActionDispatcherService } from '@integration-hub/shared/ui';
import { firstValueFrom } from 'rxjs';

import { PaymentValidationRuleApiService } from '../api/payment-validation-rule-api.service';
import {
  PaymentRulePredicateKind,
  PaymentValidationRuleDraft,
  PaymentValidationRuleImportResponse,
  PaymentValidationRuleRecord,
  createPaymentRuleDraft,
  toPaymentRuleDraft,
} from '../models/payment-validation-rule.models';

/** Vista del drawer: edición de una regla vs. panel bulk (import/export del rule-set). */
export type PaymentRulesDrawerView = 'edit' | 'bulk';

function validatePredicateBody(body: string, kind: PaymentRulePredicateKind): boolean {
  if (!body.trim() || kind === 'JEXL') {
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
    return Array.isArray(parsed) ? (parsed as PaymentValidationRuleDraft[]) : null;
  } catch {
    return null;
  }
}

/**
 * Store del catálogo de reglas de validación de pagos: dueño de la lista, filtros, paginación, el draft del editor y
 * el estado del drawer (edición / bulk). Espejo del patrón de {@code SourceCatalogStore} para alinear la pantalla al
 * design system {@code ih-catalog-*}. Toda la lógica (guards de severidad E, arm/confirm de sobrescritura e import,
 * clone, format e import/export) vive acá; los componentes de presentación solo emiten eventos.
 */
@Injectable()
export class PaymentRulesCatalogStore {
  private readonly api = inject(PaymentValidationRuleApiService);
  private readonly dispatcher = inject(ActionDispatcherService);
  private readonly feedback = inject(AppFeedbackService);

  readonly saveArmedId = 'rule:save:overwrite';
  readonly importArmedId = 'rule:import:replace';

  readonly loading = signal(false);
  readonly rules = signal<PaymentValidationRuleRecord[]>([]);
  readonly totalLength = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly ruleSetFilter = signal('bank:TEST');
  readonly search = signal('');
  readonly standardFilter = signal('SWIFT');
  readonly appliesToFilter = signal('MT101');
  readonly statusFilter = signal('ALL');

  readonly drawerOpen = signal(false);
  readonly drawerView = signal<PaymentRulesDrawerView>('edit');
  readonly selectedId = signal<number | null>(null);
  readonly draft = signal<PaymentValidationRuleDraft>(createPaymentRuleDraft());

  readonly importJson = signal('');
  readonly exportJson = signal('');
  readonly replacingImport = signal(false);

  readonly armed = this.dispatcher.armed;

  readonly editing = computed(() => this.draft().id != null);
  readonly predicateValid = computed(() =>
    validatePredicateBody(this.draft().predicateBody, this.draft().predicateKind)
  );
  readonly importParsed = computed(() => parseImportJson(this.importJson()));
  readonly importPreviewCount = computed(() => this.importParsed()?.length ?? 0);
  readonly importJsonValid = computed(() => {
    const raw = this.importJson().trim();
    return raw ? this.importParsed() !== null : true;
  });

  private debounceTimer?: ReturnType<typeof setTimeout>;

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

  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.dispatcher.disarm();
  }

  // --- Drawer / editor ---

  openCreate(): void {
    this.selectedId.set(null);
    this.draft.set(createPaymentRuleDraft(this.ruleSetFilter() || 'bank:TEST'));
    this.drawerView.set('edit');
    this.drawerOpen.set(true);
    this.dispatcher.disarm();
  }

  openEdit(rule: PaymentValidationRuleRecord): void {
    this.selectedId.set(rule.id);
    this.draft.set(toPaymentRuleDraft(rule));
    this.drawerView.set('edit');
    this.drawerOpen.set(true);
    this.dispatcher.disarm();
  }

  openClone(rule: PaymentValidationRuleRecord): void {
    const cloned = toPaymentRuleDraft(rule);
    cloned.id = null;
    cloned.code = rule.code + '-copy';
    this.selectedId.set(null);
    this.draft.set(cloned);
    this.drawerView.set('edit');
    this.drawerOpen.set(true);
    this.dispatcher.disarm();
  }

  openBulk(): void {
    this.drawerView.set('bulk');
    this.drawerOpen.set(true);
    this.dispatcher.disarm();
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
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
      this.closeDrawer();
    } catch (error) {
      this.feedback.handleHttpError(error as HttpErrorResponse);
    }
  }

  async toggle(rule: PaymentValidationRuleRecord): Promise<void> {
    if (rule.severity === 'E') {
      const actionId = `rule:toggle:E:${rule.id}`;
      const dispatched = this.dispatcher.dispatch({
        id: actionId,
        severity: rule.active ? 'danger' : 'warning',
      });
      if (!dispatched) {
        return;
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

  toggleArmedId(rule: PaymentValidationRuleRecord): string {
    return `rule:toggle:E:${rule.id}`;
  }

  // --- Bulk import / export ---

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
}
