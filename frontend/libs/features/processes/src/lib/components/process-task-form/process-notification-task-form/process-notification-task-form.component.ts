import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskFormModel } from '../../../models/process.models';
import { ProcessTaskManagerService } from '@integration-hub/core/services';
import { NotificationTaskDraft } from '@integration-hub/core/providers';

@Component({
  selector: 'ih-process-notification-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  styles: [`
    :host {
      display: grid;
      gap: 1rem;
      min-width: 0;
    }
    .task-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
      gap: 0.95rem;
      min-width: 0;
    }
    .full-width { width: 100%; }
    textarea { min-height: 8rem; }
    `],
    templateUrl: './process-notification-task-form.component.html'
})
export class ProcessNotificationTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly readonly = input(false);
  readonly patchTask = output<Partial<ProcessTaskFormModel>>();

  readonly draft = computed(() => this.manager.hydrateDraft<NotificationTaskDraft>(this.task()) ?? {
    channel: 'log',
    message: '',
    url: '',
    bodyTemplate: '{"message":"${message}"}',
    timeoutSeconds: '15',
    headersJson: '{}',
    to: '',
    subject: '',
    body: '',
  });

  updateDraft(patch: Partial<NotificationTaskDraft>): void {
    const nextDraft = { ...this.draft(), ...patch };
    this.patchTask.emit(this.manager.toTaskPatch(this.task().taskType, nextDraft));
  }
}
