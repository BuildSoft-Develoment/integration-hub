import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskFormModel, ReaderRef } from '../../../models/process.models';
import { createHttpRequestDraft, NotificationTaskDraft, ProcessTaskBindingOption, ProcessTaskFormBridgeService } from '@integration-hub/core/providers';
import { ProcessTaskBindingContextService } from '../../../forms/process-task-binding-context.service';
import { ProcessHttpRequestComponent } from '../process-http-request/process-http-request.component';
import { ProcessTaskRuntimePanelComponent } from '../process-task-runtime-panel/process-task-runtime-panel.component';
import { TaskFormShellComponent } from '../task-form-shell/task-form-shell.component';

@Component({
  selector: 'ih-process-notification-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, ProcessHttpRequestComponent, ProcessTaskRuntimePanelComponent, TaskFormShellComponent],
  styleUrl: './process-notification-task-form.component.css',
    templateUrl: './process-notification-task-form.component.html'
})
export class ProcessNotificationTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bindingContext = inject(ProcessTaskBindingContextService);
  // M-1b: outputs viajan al host via bridge.
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly readonly = input(false);

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
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, nextDraft));
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
