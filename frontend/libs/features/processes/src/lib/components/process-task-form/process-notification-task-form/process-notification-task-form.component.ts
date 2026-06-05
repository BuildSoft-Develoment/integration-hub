import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskFormModel, ReaderRef } from '../../../models/process.models';
import { createHttpRequestDraft, NotificationTaskDraft, ProcessTaskBindingOption } from '@integration-hub/core/providers';
import { ProcessTaskBindingContextService } from '../../../forms/process-task-binding-context.service';
import { ProcessHttpRequestComponent } from '../process-http-request/process-http-request.component';
import { ProcessTaskRuntimePanelComponent } from '../process-task-runtime-panel/process-task-runtime-panel.component';

@Component({
  selector: 'ih-process-notification-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, ProcessHttpRequestComponent, ProcessTaskRuntimePanelComponent],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
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
    .full-width { width: 100%; }
    textarea { min-height: 8rem; }
    .notif-http-request {
      display: block;
      width: 100%;
      min-width: 0;
      min-height: 0;
    }
    .notif-endpoint-grid {
      display: grid;
      grid-template-columns: minmax(0, 2.6fr) minmax(110px, 0.6fr);
      gap: 0.95rem;
      min-width: 0;
    }
    .notif-body-workspace {
      display: grid;
      grid-template-columns: minmax(0, 1.6fr) minmax(min(220px, 100%), 0.9fr);
      gap: 1rem;
      align-items: stretch;
      min-width: 0;
      min-height: 0;
      flex: 1;
    }
    .notif-editor {
      display: grid;
      grid-template-rows: minmax(0, 1fr) auto;
      min-width: 0;
      min-height: 0;
    }
    .notif-editor mat-form-field { height: 100%; }
    .notif-editor ::ng-deep .mat-mdc-text-field-wrapper { height: 100%; }
    .notif-editor ::ng-deep .mat-mdc-form-field-flex { height: 100%; }
    .notif-editor ::ng-deep .mat-mdc-form-field-infix { display: flex; height: 100%; min-height: 0; }
    .notif-editor textarea {
      height: 100%;
      min-height: 12rem;
      resize: none;
      box-sizing: border-box;
    }
    .notif-tokens {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      gap: 0.85rem;
      padding: 0.9rem;
      min-width: 0;
      min-height: 0;
    }
    .notif-tokens__header { display: grid; gap: 0.2rem; }
    .notif-tokens__header h5 { margin: 0; font-size: 0.92rem; }
    .notif-tokens__groups {
      display: grid;
      gap: 0.8rem;
      align-content: start;
      min-height: 0;
      overflow: auto;
      padding-right: 0.2rem;
    }
    .notif-tokens__group { display: grid; gap: 0.5rem; }
    .notif-tokens__title { font-size: 0.82rem; font-weight: 700; color: var(--ih-text-soft); }
    .notif-tokens__items { display: flex; flex-wrap: wrap; gap: 0.45rem; }
    .notif-autocomplete {
      margin-top: -0.2rem;
      padding: 0.75rem;
      display: grid;
      gap: 0.75rem;
    }
    .notif-autocomplete__group { display: grid; gap: 0.45rem; }
    .notif-autocomplete__title { font-size: 0.8rem; font-weight: 700; color: var(--ih-text-soft); }
    .notif-autocomplete__items { display: flex; flex-wrap: wrap; gap: 0.45rem; }
    .notif-autocomplete__empty { font-size: 0.86rem; color: var(--ih-text-soft); }
    @media (max-width: 900px) {
      .notif-endpoint-grid,
      .notif-body-workspace { grid-template-columns: 1fr; }
    }
    `],
    templateUrl: './process-notification-task-form.component.html'
})
export class ProcessNotificationTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bindingContext = inject(ProcessTaskBindingContextService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly readonly = input(false);
  readonly patchTask = output<Partial<ProcessTaskFormModel>>();

  readonly draft = computed<NotificationTaskDraft>(() => this.manager.hydrateDraft<NotificationTaskDraft>(this.task()) ?? {
    ...createHttpRequestDraft('POST', '15'),
    taskRef: this.task().clientId,
    executionMode: 'once',
    channel: 'log',
    message: '',
    bodyTemplate: '{"message":"${message}"}',
    to: '',
    subject: '',
    body: '',
  });
  readonly groupedSources = computed(() => this.bindingContext.groupOptions(this.bindingContext.buildOptions(this.task(), this.tasks(), this.readers(), this.draft().input)));

  readonly bodyAutocompleteVisible = signal(false);
  readonly bodyAutocompleteQuery = signal('');
  readonly activeField = signal<'message' | 'bodyTemplate' | 'body' | 'subject' | null>(null);
  private readonly bodyAutocompleteTokenStart = signal<number | null>(null);
  private activeTextarea: HTMLTextAreaElement | HTMLInputElement | null = null;

  readonly bodyAutocompleteGroups = computed(() => {
    if (!this.bodyAutocompleteVisible()) {
      return [];
    }
    const query = this.bodyAutocompleteQuery().trim().toLowerCase();
    return this.groupedSources()
      .map((group) => ({ key: group.key, items: group.items.filter((item) => this.matchesAutocomplete(item, query)) }))
      .filter((group) => group.items.length);
  });

  updateDraft(patch: Partial<NotificationTaskDraft>): void {
    const nextDraft = { ...this.draft(), ...patch };
    this.patchTask.emit(this.manager.toTaskPatch(this.task().taskType, nextDraft));
  }

  /** Token calificado a insertar para una opción (agregados -> `taskRef.output.campo`). P1.c. */
  bodyToken(option: ProcessTaskBindingOption): string {
    return this.bindingContext.tokenForOption(option, String(this.draft().input?.sourceTaskRef || '').trim());
  }

  insertTokenAt(field: 'message' | 'bodyTemplate' | 'body' | 'subject', key: string, textarea: HTMLTextAreaElement | HTMLInputElement): void {
    if (this.readonly()) {
      return;
    }
    const token = `{${key}}`;
    const current = String(this.draft()[field] || '');
    const start = textarea?.selectionStart ?? current.length;
    const end = textarea?.selectionEnd ?? start;
    const next = current.slice(0, start) + token + current.slice(end);
    this.updateDraft({ [field]: next } as Partial<NotificationTaskDraft>);
    setTimeout(() => {
      if (!textarea) {
        return;
      }
      textarea.focus();
      const caret = start + token.length;
      textarea.setSelectionRange(caret, caret);
    });
  }

  handleBodyInput(field: 'message' | 'bodyTemplate' | 'body' | 'subject', textarea: HTMLTextAreaElement | HTMLInputElement, value: string): void {
    this.activeField.set(field);
    this.activeTextarea = textarea;
    this.updateDraft({ [field]: value } as Partial<NotificationTaskDraft>);
    this.syncAutocomplete(textarea, value);
  }

  handleBodyInteraction(field: 'message' | 'bodyTemplate' | 'body' | 'subject', textarea: HTMLTextAreaElement | HTMLInputElement): void {
    this.activeField.set(field);
    this.activeTextarea = textarea;
    this.syncAutocomplete(textarea, textarea.value);
  }

  handleBodyKeydown(event: KeyboardEvent, field: 'message' | 'bodyTemplate' | 'body' | 'subject', textarea: HTMLTextAreaElement | HTMLInputElement): void {
    if (event.key === 'Escape') {
      this.closeAutocomplete();
      return;
    }
    this.activeField.set(field);
    this.activeTextarea = textarea;
    queueMicrotask(() => this.syncAutocomplete(textarea, textarea.value));
  }

  handleBodyBlur(): void {
    setTimeout(() => this.closeAutocomplete(), 120);
  }

  insertActiveToken(key: string): void {
    const field = this.activeField();
    const textarea = this.activeTextarea;
    if (!field || !textarea) {
      return;
    }
    this.insertTokenAt(field, key, textarea);
  }

  insertAutocomplete(option: ProcessTaskBindingOption): void {
    if (this.readonly()) {
      return;
    }
    const field = this.activeField();
    if (!field) {
      return;
    }
    const textarea = this.activeTextarea;
    const current = String(this.draft()[field] || '');
    const tokenStart = this.bodyAutocompleteTokenStart();
    const selectionEnd = textarea?.selectionEnd ?? current.length;
    const start = tokenStart ?? (textarea?.selectionStart ?? current.length);
    const token = `{${this.bodyToken(option)}}`;
    const next = current.slice(0, start) + token + current.slice(selectionEnd);
    const caret = start + token.length;
    this.updateDraft({ [field]: next } as Partial<NotificationTaskDraft>);
    this.closeAutocomplete();
    setTimeout(() => {
      if (!textarea) {
        return;
      }
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  }

  private syncAutocomplete(textarea: HTMLTextAreaElement | HTMLInputElement, value: string): void {
    const caret = textarea.selectionStart ?? value.length;
    const prefix = value.slice(0, caret);
    const openIndex = prefix.lastIndexOf('{');
    const closeIndex = prefix.lastIndexOf('}');
    if (openIndex === -1 || closeIndex > openIndex) {
      this.closeAutocomplete();
      return;
    }
    const query = prefix.slice(openIndex + 1);
    if (/[{\s"]/u.test(query)) {
      this.closeAutocomplete();
      return;
    }
    this.bodyAutocompleteTokenStart.set(openIndex);
    this.bodyAutocompleteQuery.set(query);
    this.bodyAutocompleteVisible.set(true);
  }

  private closeAutocomplete(): void {
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
}
