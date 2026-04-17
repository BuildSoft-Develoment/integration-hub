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
import { ProcessTaskFormModel, ReaderRef } from '../../../process.models';
import { ProcessTaskBindingContextService } from '../../../process-task-binding-context.service';
import { ProcessRestPathBuilderComponent } from '../process-rest-path-builder/process-rest-path-builder.component';
import { ProcessTaskBindingBoardComponent } from '../process-task-binding-board/process-task-binding-board.component';

@Component({
  selector: 'ih-process-rest-call-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTabsModule, ProcessTaskBindingBoardComponent, ProcessRestPathBuilderComponent],
    templateUrl: './process-rest-call-task-form.component.html',
    styleUrl: './process-rest-call-task-form.component.css'
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
