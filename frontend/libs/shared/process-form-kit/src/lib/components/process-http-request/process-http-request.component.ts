// @trace spec 003-diseno-y-ejecucion-procesos RF-002, RF-012 (procesos: configuracion HTTP comun REST_CALL + webhook NOTIFICATION) ADR-005
import { CommonModule } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import {
  HttpRequestDraft,
  ProcessTaskBindingOption,
  ProcessTaskBodyFieldBindingDraft,
  ProcessTaskInputDraft,
  ProcessTaskParameterBindingDraft,
} from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskFormModel, ReaderRef } from '@integration-hub/core/providers';
import { ProcessTaskBindingContextService } from '../../services/process-task-binding-context.service';
import { ProcessRestPathBuilderComponent } from '../process-rest-path-builder/process-rest-path-builder.component';
import { ProcessTaskBindingBoardComponent } from '../process-task-binding-board/process-task-binding-board.component';

type HttpBindingSection = 'pathParameters' | 'queryParameters' | 'headerMappings';

/**
 * Configuracion reutilizable de una peticion HTTP saliente: endpoint (metodo/baseUrl/timeout),
 * path-builder y pestanas Query / Auth / Headers / Body (con tokens + autocomplete). La consumen
 * la tarea REST_CALL y el canal `webhook` de NOTIFICATION. Ver ADR-005.
 */
@Component({
  selector: 'ih-process-http-request',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTabsModule, ProcessTaskBindingBoardComponent, ProcessRestPathBuilderComponent],
  templateUrl: './process-http-request.component.html',
  styleUrl: './process-http-request.component.css',
})
export class ProcessHttpRequestComponent {
  readonly i18n = inject(I18nService);
  private readonly bindingContext = inject(ProcessTaskBindingContextService);

  readonly httpRequest = input.required<HttpRequestDraft>();
  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly runtimeInput = input<ProcessTaskInputDraft | undefined>(undefined);
  readonly readonly = input(false);
  readonly showPath = input(true);
  readonly httpRequestChange = output<Partial<HttpRequestDraft>>();

  readonly groupedSources = computed(() => this.bindingContext.groupOptions(this.bindingContext.buildOptions(this.task(), this.tasks(), this.readers(), this.runtimeInput())));
  readonly resolvedUrl = computed(() => this.composeUrl(this.httpRequest().baseUrl, this.pathSegmentEntries(), this.queryParameterEntries()));
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
      this.pathSegmentEntries.set(this.cloneEntries(this.httpRequest().pathParameters));
      this.queryParameterEntries.set(this.cloneEntries(this.httpRequest().queryParameters));
      this.headerMappingEntries.set(this.cloneEntries(this.httpRequest().headerMappings));
    });
  }

  emit(patch: Partial<HttpRequestDraft>): void {
    this.httpRequestChange.emit(patch);
  }

  addBindingEntry(section: HttpBindingSection): void {
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

  updateSectionEntries(section: HttpBindingSection, entries: readonly ProcessTaskParameterBindingDraft[]): void {
    const next = this.normalizeEntries(entries);
    this.setSectionEntries(section, next);
    this.persistSection(section, next);
  }

  handleBodyTemplateChange(textarea: HTMLTextAreaElement, value: string): void {
    this.emit({ bodyTemplate: value });
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

  /** Token calificado a insertar para una opción (agregados -> `taskRef.output.campo`). P1.c. */
  bodyToken(option: ProcessTaskBindingOption): string {
    return this.bindingContext.tokenForOption(option, this.currentSourceTaskRef());
  }

  private currentSourceTaskRef(): string {
    const input = this.runtimeInput() ?? this.bindingContext.configuredInput(this.task(), this.tasks());
    return String(input?.sourceTaskRef || '').trim();
  }

  insertBodyToken(key: string): void {
    if (this.readonly()) {
      return;
    }
    const textarea = this.bodyTemplateInput()?.nativeElement;
    const current = this.httpRequest().bodyTemplate || '';
    const fallbackIndex = current.length;
    const selectionStart = this.bodySelectionStart() ?? textarea?.selectionStart ?? fallbackIndex;
    const selectionEnd = this.bodySelectionEnd() ?? textarea?.selectionEnd ?? selectionStart;
    const token = `{${key}}`;
    const nextValue = `${current.slice(0, selectionStart)}${token}${current.slice(selectionEnd)}`;
    const nextCaret = selectionStart + token.length;
    this.emit({ bodyTemplate: nextValue });
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
    const current = this.httpRequest().bodyTemplate || '';
    const tokenStart = this.bodyAutocompleteTokenStart();
    const selectionEnd = this.bodySelectionEnd() ?? textarea?.selectionEnd ?? current.length;
    if (tokenStart === null) {
      this.insertBodyToken(this.bodyToken(option));
      return;
    }
    const token = `{${this.bodyToken(option)}}`;
    const nextValue = `${current.slice(0, tokenStart)}${token}${current.slice(selectionEnd)}`;
    const nextCaret = tokenStart + token.length;
    this.emit({ bodyTemplate: nextValue });
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

  private persistSection(section: HttpBindingSection, entries: readonly ProcessTaskBodyFieldBindingDraft[]): void {
    this.emit({ [section]: entries } as Partial<HttpRequestDraft>);
  }

  private getSectionEntries(section: HttpBindingSection): ProcessTaskBodyFieldBindingDraft[] {
    switch (section) {
      case 'pathParameters':
        return this.pathSegmentEntries();
      case 'queryParameters':
        return this.queryParameterEntries();
      default:
        return this.headerMappingEntries();
    }
  }

  private setSectionEntries(section: HttpBindingSection, entries: ProcessTaskBodyFieldBindingDraft[]): void {
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
