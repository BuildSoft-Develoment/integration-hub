import { CommonModule } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProcessTaskBindingOption } from '@integration-hub/core/providers';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { ProcessTaskBodyFieldBindingDraft, ProcessTaskParameterBindingDraft, RestCallTaskDraft } from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskFormModel, ReaderRef } from '../../process.models';
import { ProcessTaskBindingContextService } from '../../process-task-binding-context.service';
import { ProcessRestPathBuilderComponent } from './process-rest-path-builder.component';
import { ProcessTaskBindingBoardComponent } from './process-task-binding-board.component';

@Component({
  selector: 'ih-process-rest-call-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTabsModule, ProcessTaskBindingBoardComponent, ProcessRestPathBuilderComponent],
  template: `
    <div class="task-grid">
      <mat-form-field>
        <mat-label>{{ i18n.t('ui.modeLabel') }}</mat-label>
        <mat-select [disabled]="readonly()" [ngModel]="draft().mode" (ngModelChange)="updateDraft({ mode: $event })">
          <mat-option value="per-record">{{ i18n.t('ui.restMode.perRecord') }}</mat-option>
          <mat-option value="single-request">{{ i18n.t('ui.restMode.singleRequest') }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ i18n.t('ui.method') }}</mat-label>
        <mat-select [disabled]="readonly()" [ngModel]="draft().method" (ngModelChange)="updateDraft({ method: $event })">
          @for (method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']; track method) {
            <mat-option [value]="method">{{ method }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ i18n.t('ui.timeoutSeconds') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().timeoutSeconds" (ngModelChange)="updateDraft({ timeoutSeconds: $event })" />
      </mat-form-field>
    </div>

    <section class="rest-section ih-form-card">
      <div class="rest-section__header">
        <p class="section-eyebrow">{{ i18n.t('ui.restUrlSection') }}</p>
        <h5>{{ i18n.t('ui.restUrlSectionHint') }}</h5>
      </div>

      <mat-form-field class="full-width">
        <mat-label>{{ i18n.t('ui.restBaseUrl') }}</mat-label>
        <input matInput [disabled]="readonly()" [ngModel]="draft().baseUrl" (ngModelChange)="updateDraft({ baseUrl: $event })" />
      </mat-form-field>

      <mat-form-field class="full-width">
        <mat-label>{{ i18n.t('ui.restResolvedUrl') }}</mat-label>
        <input matInput [value]="resolvedUrl()" readonly />
      </mat-form-field>
    </section>

    <mat-tab-group animationDuration="0ms" class="rest-tabs">
      <mat-tab [label]="i18n.t('ui.restQueryParameters')">
        <div class="rest-tab-content">
          <ih-process-rest-path-builder
            [segments]="pathSegmentEntries()"
            [sourceGroups]="groupedSources()"
            [readonly]="readonly()"
            (segmentsChange)="updatePathSegments($event)"
          />

          <ih-process-task-binding-board
            [entries]="queryEntries()"
            [sourceGroups]="groupedSources()"
            [readonly]="readonly()"
            [showJdbcType]="false"
            [showDirection]="false"
            [titleKey]="'ui.restQueryParameters'"
            [hintKey]="'ui.restQueryParametersHint'"
            [nameLabelKey]="'ui.restQueryParamName'"
            [addLabelKey]="'ui.restAddQueryParam'"
            [expressionLabelKey]="'ui.restValueTemplate'"
            (entriesChange)="updateSectionEntries('queryParameters', $event)"
            (requestAddEntry)="addBindingEntry('queryParameters')"
          />
        </div>
      </mat-tab>

      <mat-tab [label]="i18n.t('ui.restAuthSection')">
        <div class="rest-tab-content">
          <section class="rest-section ih-form-card">
            <div class="rest-section__header">
              <p class="section-eyebrow">{{ i18n.t('ui.restAuthSection') }}</p>
              <h5>{{ i18n.t('ui.restAuthSectionHint') }}</h5>
            </div>

            <mat-form-field>
              <mat-label>{{ i18n.t('ui.authType') }}</mat-label>
              <mat-select [disabled]="readonly()" [ngModel]="draft().authType" (ngModelChange)="updateDraft({ authType: $event })">
                <mat-option value="">{{ i18n.t('ui.authNone') }}</mat-option>
                <mat-option value="basic">{{ i18n.t('ui.authBasic') }}</mat-option>
                <mat-option value="bearer">{{ i18n.t('ui.authBearer') }}</mat-option>
                <mat-option value="login-request">{{ i18n.t('ui.authLoginRequest') }}</mat-option>
              </mat-select>
            </mat-form-field>

            @if (draft().authType === 'basic') {
              <div class="task-grid">
                <mat-form-field>
                  <mat-label>{{ i18n.t('ui.username') }}</mat-label>
                  <input matInput [disabled]="readonly()" [ngModel]="draft().username" (ngModelChange)="updateDraft({ username: $event })" />
                </mat-form-field>

                <mat-form-field>
                  <mat-label>{{ i18n.t('ui.password') }}</mat-label>
                  <input matInput [disabled]="readonly()" [ngModel]="draft().password" (ngModelChange)="updateDraft({ password: $event })" />
                </mat-form-field>
              </div>
            }

            @if (draft().authType === 'bearer') {
              <mat-form-field class="full-width">
                <mat-label>{{ i18n.t('ui.bearerToken') }}</mat-label>
                <input matInput [disabled]="readonly()" [ngModel]="draft().token" (ngModelChange)="updateDraft({ token: $event })" />
              </mat-form-field>
            }

            @if (draft().authType === 'login-request') {
              <div class="task-grid">
                <mat-form-field>
                  <mat-label>{{ i18n.t('ui.loginUrl') }}</mat-label>
                  <input matInput [disabled]="readonly()" [ngModel]="draft().loginUrl" (ngModelChange)="updateDraft({ loginUrl: $event })" />
                </mat-form-field>

                <mat-form-field>
                  <mat-label>{{ i18n.t('ui.loginMethod') }}</mat-label>
                  <mat-select [disabled]="readonly()" [ngModel]="draft().loginMethod" (ngModelChange)="updateDraft({ loginMethod: $event })">
                    @for (method of ['POST', 'PUT', 'PATCH']; track method) {
                      <mat-option [value]="method">{{ method }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field>
                  <mat-label>{{ i18n.t('ui.tokenPath') }}</mat-label>
                  <input matInput [disabled]="readonly()" [ngModel]="draft().tokenPath" (ngModelChange)="updateDraft({ tokenPath: $event })" />
                </mat-form-field>
              </div>

              <mat-form-field class="full-width">
                <mat-label>{{ i18n.t('ui.headersJson') }}</mat-label>
                <textarea matInput [disabled]="readonly()" [ngModel]="draft().loginHeadersJson" (ngModelChange)="updateDraft({ loginHeadersJson: $event })"></textarea>
              </mat-form-field>

              <mat-form-field class="full-width">
                <mat-label>{{ i18n.t('ui.loginBody') }}</mat-label>
                <textarea matInput [disabled]="readonly()" [ngModel]="draft().loginBodyTemplate" (ngModelChange)="updateDraft({ loginBodyTemplate: $event })"></textarea>
              </mat-form-field>
            }
          </section>
        </div>
      </mat-tab>

      <mat-tab [label]="i18n.t('ui.restHeaders')">
        <div class="rest-tab-content">
          <ih-process-task-binding-board
            [entries]="headerEntries()"
            [sourceGroups]="groupedSources()"
            [readonly]="readonly()"
            [showJdbcType]="false"
            [showDirection]="false"
            [titleKey]="'ui.restHeaders'"
            [hintKey]="'ui.restHeadersHint'"
            [nameLabelKey]="'ui.restHeaderName'"
            [addLabelKey]="'ui.restAddHeader'"
            [expressionLabelKey]="'ui.restValueTemplate'"
            (entriesChange)="updateSectionEntries('headerMappings', $event)"
            (requestAddEntry)="addBindingEntry('headerMappings')"
          />
        </div>
      </mat-tab>

      <mat-tab [label]="i18n.t('ui.body')">
        <div class="rest-tab-content">
          <section class="rest-section ih-form-card">
            <div class="rest-section__header">
              <p class="ih-section-eyebrow">{{ i18n.t('ui.restBodyTemplate') }}</p>
              <h5>{{ i18n.t('ui.restBodyTemplateHint') }}</h5>
            </div>

            <div class="rest-body-workspace">
              <div class="rest-body-editor">
                <mat-form-field class="full-width">
                  <mat-label>{{ i18n.t('ui.restBodyJsonTemplate') }}</mat-label>
                  <textarea
                    #bodyTemplateInput
                    matInput
                    [disabled]="readonly()"
                    [ngModel]="draft().bodyTemplate"
                    (ngModelChange)="handleBodyTemplateChange(bodyTemplateInput, $event)"
                    (click)="handleBodyInteraction(bodyTemplateInput)"
                    (keyup)="handleBodyInteraction(bodyTemplateInput)"
                    (select)="handleBodyInteraction(bodyTemplateInput)"
                    (keydown)="handleBodyKeydown($event, bodyTemplateInput)"
                    (blur)="handleBodyBlur()"
                  ></textarea>
                </mat-form-field>

                @if (bodyAutocompleteVisible()) {
                    <section class="rest-body-autocomplete ih-panel-surface">
                    @if (bodyAutocompleteGroups().length) {
                      @for (group of bodyAutocompleteGroups(); track group.key) {
                        <div class="rest-body-autocomplete__group">
                          <header class="rest-body-autocomplete__title">{{ i18n.t(group.key) }}</header>
                          <div class="rest-body-autocomplete__items">
                            @for (item of group.items; track item.key) {
                              <button
                                type="button"
                                class="rest-body-autocomplete__option ih-token-chip"
                                [disabled]="readonly()"
                                (mousedown)="insertBodyAutocomplete(item)"
                              >
                                {{ item.label }}
                              </button>
                            }
                          </div>
                        </div>
                      }
                    } @else {
                      <div class="rest-body-autocomplete__empty">{{ i18n.t('ui.restBodyAutocompleteEmpty') }}</div>
                    }
                  </section>
                }
              </div>

              <aside class="rest-token-panel ih-soft-panel">
                <div class="rest-token-panel__header">
                  <p class="ih-section-eyebrow">{{ i18n.t('ui.restBodyTokens') }}</p>
                  <h5>{{ i18n.t('ui.restBodyTokensHint') }}</h5>
                </div>

                <div class="rest-token-groups">
                  @for (group of groupedSources(); track group.key) {
                    <section class="rest-token-group">
                      <header class="rest-token-group__title">{{ i18n.t(group.key) }}</header>
                      <div class="rest-token-group__items">
                        @for (item of group.items; track item.key) {
                          <button
                            type="button"
                            class="rest-token-chip ih-token-chip"
                            [disabled]="readonly()"
                            (click)="insertBodyToken(item.key)"
                          >
                            {{ item.label }}
                          </button>
                        }
                      </div>
                    </section>
                  }
                </div>
              </aside>
            </div>
          </section>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
      :host {
        display: grid;
        grid-template-rows: auto auto minmax(0, 1fr);
        gap: 1rem;
        min-width: 0;
        min-height: 0;
        height: 100%;
      }
      .task-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
        gap: 0.95rem;
        min-width: 0;
      }
      .rest-section {
        display: grid;
        gap: 0.9rem;
        align-content: start;
        align-self: start;
        height: fit-content;
      }
      .rest-section__header {
        display: grid;
        gap: 0.22rem;
      }
      .rest-section__header h5 {
        margin: 0;
        font-size: 0.98rem;
      }
      .full-width { width: 100%; }
      textarea { min-height: 8rem; }
      .rest-tabs {
        min-width: 0;
        min-height: 0;
        height: 100%;
        display: grid;
      }
      .rest-tabs ::ng-deep .mat-mdc-tab-group {
        min-height: 0;
        height: 100%;
      }
      .rest-tabs ::ng-deep .mat-mdc-tab-header {
        margin: 0;
        padding: 0;
      }
      .rest-tabs ::ng-deep .mat-mdc-tab-body-wrapper,
      .rest-tabs ::ng-deep .mat-mdc-tab-body,
      .rest-tabs ::ng-deep .mat-mdc-tab-body-content {
        min-height: 0;
        height: 100%;
      }
      .rest-tabs ::ng-deep .mat-mdc-tab-body-wrapper {
        margin-top: 0;
        padding-top: 0;
      }
      .rest-tabs ::ng-deep .mat-mdc-tab-body {
        padding-top: 0;
      }
      .rest-tabs ::ng-deep .mat-mdc-tab-body-content {
        overflow: auto;
      }
      .rest-tab-content {
        display: block;
        padding-top: 0;
        padding-bottom: 0.4rem;
        min-height: 0;
      }
      .rest-tab-content > * + * {
        margin-top: 1rem;
      }
      .rest-body-workspace {
        display: grid;
        grid-template-columns: minmax(0, 1.6fr) minmax(min(220px, 100%), 0.9fr);
        gap: 1rem;
        align-items: start;
        min-width: 0;
      }
      .rest-body-workspace > :first-child {
        min-width: 0;
      }
      .rest-body-editor {
        display: grid;
        gap: 0.65rem;
        align-content: start;
        min-width: 0;
      }
      .rest-body-workspace mat-form-field {
        display: block;
      }
      .rest-body-autocomplete {
        margin-top: -0.2rem;
        padding: 0.75rem;
        display: grid;
        gap: 0.75rem;
      }
      .rest-body-autocomplete__group {
        display: grid;
        gap: 0.45rem;
      }
      .rest-body-autocomplete__title {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--ih-text-soft);
      }
      .rest-body-autocomplete__items {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }
      .rest-body-autocomplete__empty {
        font-size: 0.86rem;
        color: var(--ih-text-soft);
      }
      .rest-token-panel {
        display: grid;
        gap: 0.85rem;
        padding: 0.9rem;
        min-width: 0;
      }
      .rest-token-panel__header {
        display: grid;
        gap: 0.2rem;
      }
      .rest-token-panel__header h5 {
        margin: 0;
        font-size: 0.92rem;
      }
      .rest-token-groups {
        display: grid;
        gap: 0.8rem;
        max-height: 20rem;
        overflow: auto;
        padding-right: 0.2rem;
      }
      .rest-token-group {
        display: grid;
        gap: 0.5rem;
      }
      .rest-token-group__title {
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--ih-text-soft);
      }
      .rest-token-group__items {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }
      @media (max-width: 900px) {
        :host {
          height: auto;
          min-height: auto;
          grid-template-rows: auto auto auto;
        }
        .rest-body-workspace {
          grid-template-columns: 1fr;
        }
        .rest-tabs {
          height: auto;
          min-height: auto;
          display: block;
        }
        .rest-tabs ::ng-deep .mat-mdc-tab-group,
        .rest-tabs ::ng-deep .mat-mdc-tab-body-wrapper,
        .rest-tabs ::ng-deep .mat-mdc-tab-body,
        .rest-tabs ::ng-deep .mat-mdc-tab-body-content {
          height: auto;
          min-height: auto;
        }
        .rest-tabs ::ng-deep .mat-mdc-tab-body-content {
          overflow: visible;
        }
        .rest-token-groups {
          max-height: none;
          overflow: visible;
        }
      }
    `],
})
export class ProcessRestCallTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bindingContext = inject(ProcessTaskBindingContextService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly readonly = input(false);
  readonly patchTask = output<Partial<ProcessTaskFormModel>>();

  readonly draft = computed(() => this.manager.hydrateDraft<RestCallTaskDraft>(this.task()) ?? {
    mode: 'per-record',
    method: 'POST',
    baseUrl: '',
    pathTemplate: '',
    url: '',
    pathParameters: [],
    queryParameters: [],
    headerMappings: [],
    bodyTemplate: '',
    bodyMappings: [],
    timeoutSeconds: '20',
    authType: '',
    username: '',
    password: '',
    token: '',
    headersJson: '{}',
    loginUrl: '',
    loginMethod: 'POST',
    loginHeadersJson: '{}',
    loginBodyTemplate: '',
    tokenPath: '$.access_token',
  });
  readonly groupedSources = computed(() => this.bindingContext.groupOptions(this.bindingContext.buildOptions(this.task(), this.tasks(), this.readers())));
  readonly resolvedUrl = computed(() => this.composeUrl(this.draft().baseUrl, this.pathSegmentEntries(), this.queryParameterEntries()));
  readonly queryEntries = computed(() => this.asBoardEntries(this.queryParameterEntries()));
  readonly headerEntries = computed(() => this.asBoardEntries(this.headerMappingEntries()));
  readonly bodyAutocompleteGroups = computed(() => {
    if (!this.bodyAutocompleteVisible()) {
      return [];
    }
    const query = this.bodyAutocompleteQuery().trim().toLowerCase();
    return this.groupedSources()
      .map((group) => ({
        key: group.key,
        items: group.items.filter((item) => this.matchesAutocomplete(item, query)),
      }))
      .filter((group) => group.items.length);
  });
  readonly bodyTemplateInput = viewChild<ElementRef<HTMLTextAreaElement>>('bodyTemplateInput');

  readonly pathSegmentEntries = signal<ProcessTaskBodyFieldBindingDraft[]>([]);
  private readonly queryParameterEntries = signal<ProcessTaskBodyFieldBindingDraft[]>([]);
  private readonly headerMappingEntries = signal<ProcessTaskBodyFieldBindingDraft[]>([]);
  private readonly bodySelectionStart = signal<number | null>(null);
  private readonly bodySelectionEnd = signal<number | null>(null);
  readonly bodyAutocompleteQuery = signal('');
  readonly bodyAutocompleteVisible = signal(false);
  private readonly bodyAutocompleteTokenStart = signal<number | null>(null);
  private lastTaskClientId = '';

  constructor() {
    effect(() => {
      const taskClientId = this.task().clientId;
      if (taskClientId === this.lastTaskClientId) {
        return;
      }
      this.lastTaskClientId = taskClientId;
      this.pathSegmentEntries.set(this.cloneEntries(this.draft().pathParameters));
      this.queryParameterEntries.set(this.cloneEntries(this.draft().queryParameters));
      this.headerMappingEntries.set(this.cloneEntries(this.draft().headerMappings));
    });
  }

  addBindingEntry(section: 'pathParameters' | 'queryParameters' | 'headerMappings'): void {
    const next = [
      ...this.getSectionEntries(section),
      { name: '', sourceKind: null, sourceKey: '', sourceLabel: '', expression: '' },
    ];
    this.setSectionEntries(section, next);
    this.persistSection(section, next);
  }

  updatePathSegments(entries: ProcessTaskBodyFieldBindingDraft[]): void {
    const next = this.cloneEntries(entries);
    this.pathSegmentEntries.set(next);
    this.persistSection('pathParameters', next);
  }

  normalizeEntries(entries: readonly ProcessTaskParameterBindingDraft[]): ProcessTaskBodyFieldBindingDraft[] {
    return entries.map((entry) => ({
      name: entry.name || '',
      sourceKind: entry.sourceKind ?? null,
      sourceKey: entry.sourceKey || '',
      sourceLabel: entry.sourceLabel || '',
      expression: entry.expression || '',
    }));
  }

  updateSectionEntries(section: 'pathParameters' | 'queryParameters' | 'headerMappings', entries: readonly ProcessTaskParameterBindingDraft[]): void {
    const next = this.normalizeEntries(entries);
    this.setSectionEntries(section, next);
    this.persistSection(section, next);
  }

  updateDraft(patch: Partial<RestCallTaskDraft>): void {
    const nextDraft = { ...this.draft(), ...patch };
    this.patchTask.emit(this.manager.toTaskPatch(this.task().taskType, nextDraft));
  }

  handleBodyTemplateChange(textarea: HTMLTextAreaElement, value: string): void {
    this.updateDraft({ bodyTemplate: value });
    this.syncBodyAutocomplete(textarea, value);
  }

  handleBodyInteraction(textarea: HTMLTextAreaElement): void {
    this.captureBodySelection(textarea);
    this.syncBodyAutocomplete(textarea, textarea.value);
  }

  handleBodyKeydown(event: KeyboardEvent, textarea: HTMLTextAreaElement): void {
    if (event.key === 'Escape') {
      this.closeBodyAutocomplete();
      return;
    }
    queueMicrotask(() => this.syncBodyAutocomplete(textarea, textarea.value));
  }

  handleBodyBlur(): void {
    setTimeout(() => this.closeBodyAutocomplete(), 120);
  }

  captureBodySelection(textarea: HTMLTextAreaElement): void {
    this.bodySelectionStart.set(textarea.selectionStart ?? null);
    this.bodySelectionEnd.set(textarea.selectionEnd ?? null);
  }

  insertBodyToken(key: string): void {
    if (this.readonly()) {
      return;
    }
    const textarea = this.bodyTemplateInput()?.nativeElement;
    const current = this.draft().bodyTemplate || '';
    const fallbackIndex = current.length;
    const selectionStart = this.bodySelectionStart() ?? textarea?.selectionStart ?? fallbackIndex;
    const selectionEnd = this.bodySelectionEnd() ?? textarea?.selectionEnd ?? selectionStart;
    const token = `{${key}}`;
    const nextValue = `${current.slice(0, selectionStart)}${token}${current.slice(selectionEnd)}`;
    const nextCaret = selectionStart + token.length;
    this.updateDraft({ bodyTemplate: nextValue });
    this.bodySelectionStart.set(nextCaret);
    this.bodySelectionEnd.set(nextCaret);
    queueMicrotask(() => {
      const input = this.bodyTemplateInput()?.nativeElement;
      if (!input) {
        return;
      }
      input.focus();
      input.setSelectionRange(nextCaret, nextCaret);
    });
  }

  insertBodyAutocomplete(option: ProcessTaskBindingOption): void {
    const textarea = this.bodyTemplateInput()?.nativeElement;
    const current = this.draft().bodyTemplate || '';
    const tokenStart = this.bodyAutocompleteTokenStart();
    const selectionEnd = this.bodySelectionEnd() ?? textarea?.selectionEnd ?? current.length;
    if (tokenStart === null) {
      this.insertBodyToken(option.key);
      return;
    }
    const token = `{${option.key}}`;
    const nextValue = `${current.slice(0, tokenStart)}${token}${current.slice(selectionEnd)}`;
    const nextCaret = tokenStart + token.length;
    this.updateDraft({ bodyTemplate: nextValue });
    this.bodySelectionStart.set(nextCaret);
    this.bodySelectionEnd.set(nextCaret);
    this.closeBodyAutocomplete();
    queueMicrotask(() => {
      const input = this.bodyTemplateInput()?.nativeElement;
      if (!input) {
        return;
      }
      input.focus();
      input.setSelectionRange(nextCaret, nextCaret);
    });
  }

  private composeUrl(baseUrl: string, pathSegments: readonly ProcessTaskBodyFieldBindingDraft[], queryParameters: readonly ProcessTaskBodyFieldBindingDraft[]): string {
    const normalizedBase = String(baseUrl || '').trim().replace(/\/+$/, '');
    const path = this.composePath(pathSegments);
    const query = queryParameters
      .filter((item) => item.name?.trim())
      .map((item) => `${item.name.trim()}=${item.expression?.trim() || this.toPlaceholder(item)}`)
      .join('&');
    return `${normalizedBase}${path}${query ? `?${query}` : ''}`;
  }

  private toPlaceholder(item: ProcessTaskBodyFieldBindingDraft): string {
    const key = item.sourceKey?.trim();
    if (!key) {
      return '';
    }
    return `{${key}}`;
  }

  private asBoardEntries(entries: readonly ProcessTaskBodyFieldBindingDraft[]): ProcessTaskParameterBindingDraft[] {
    return entries.map((entry) => ({
      name: entry.name || '',
      jdbcType: '',
      direction: 'IN',
      sourceKind: entry.sourceKind ?? null,
      sourceKey: entry.sourceKey || '',
      sourceLabel: entry.sourceLabel || '',
      expression: entry.expression || '',
    }));
  }

  private persistSection(section: 'pathParameters' | 'queryParameters' | 'headerMappings', entries: readonly ProcessTaskBodyFieldBindingDraft[]): void {
    this.updateDraft({ [section]: entries } as Partial<RestCallTaskDraft>);
  }

  private getSectionEntries(section: 'pathParameters' | 'queryParameters' | 'headerMappings'): ProcessTaskBodyFieldBindingDraft[] {
    switch (section) {
      case 'pathParameters':
        return this.pathSegmentEntries();
      case 'queryParameters':
        return this.queryParameterEntries();
      default:
        return this.headerMappingEntries();
    }
  }

  private setSectionEntries(section: 'pathParameters' | 'queryParameters' | 'headerMappings', entries: ProcessTaskBodyFieldBindingDraft[]): void {
    switch (section) {
      case 'pathParameters':
        this.pathSegmentEntries.set(entries);
        break;
      case 'queryParameters':
        this.queryParameterEntries.set(entries);
        break;
      default:
        this.headerMappingEntries.set(entries);
        break;
    }
  }

  private cloneEntries(entries: readonly ProcessTaskBodyFieldBindingDraft[]): ProcessTaskBodyFieldBindingDraft[] {
    return entries.map((entry) => ({ ...entry }));
  }

  private syncBodyAutocomplete(textarea: HTMLTextAreaElement, value: string): void {
    const caret = textarea.selectionStart ?? value.length;
    const prefix = value.slice(0, caret);
    const openIndex = prefix.lastIndexOf('{');
    const closeIndex = prefix.lastIndexOf('}');
    if (openIndex === -1 || closeIndex > openIndex) {
      this.closeBodyAutocomplete();
      return;
    }
    const query = prefix.slice(openIndex + 1);
    if (/[{\s"]/u.test(query)) {
      this.closeBodyAutocomplete();
      return;
    }
    this.bodyAutocompleteTokenStart.set(openIndex);
    this.bodyAutocompleteQuery.set(query);
    this.bodyAutocompleteVisible.set(true);
  }

  private closeBodyAutocomplete(): void {
    this.bodyAutocompleteVisible.set(false);
    this.bodyAutocompleteQuery.set('');
    this.bodyAutocompleteTokenStart.set(null);
  }

  private matchesAutocomplete(option: ProcessTaskBindingOption, query: string): boolean {
    if (!query) {
      return true;
    }
    return option.key.toLowerCase().includes(query) || option.label.toLowerCase().includes(query);
  }

  private composePath(segments: readonly ProcessTaskBodyFieldBindingDraft[]): string {
    if (!segments.length) {
      return '';
    }
    const normalized = segments
      .map((segment) => segment.expression?.trim() || this.toPlaceholder(segment))
      .filter(Boolean)
      .join('/');
    return normalized ? `/${normalized}` : '';
  }
}
