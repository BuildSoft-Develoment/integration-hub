import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService } from '@integration-hub/core/services';
import { ProcessTaskFormModel } from '../../process.models';
import { ProcessTaskManagerService } from '@integration-hub/core/services';
import { NotificationTaskDraft } from '@integration-hub/core/providers';

@Component({
  selector: 'ih-process-notification-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <mat-form-field>
      <mat-label>{{ i18n.t('ui.channel') }}</mat-label>
      <mat-select [disabled]="readonly()" [ngModel]="draft().channel" (ngModelChange)="updateDraft({ channel: $event })">
        <mat-option value="log">{{ i18n.t('ui.notificationChannel.log') }}</mat-option>
        <mat-option value="webhook">{{ i18n.t('ui.notificationChannel.webhook') }}</mat-option>
        <mat-option value="email">{{ i18n.t('ui.notificationChannel.email') }}</mat-option>
      </mat-select>
    </mat-form-field>

    @if (draft().channel === 'log') {
      <mat-form-field class="full-width">
        <mat-label>{{ i18n.t('ui.message') }}</mat-label>
        <textarea matInput [disabled]="readonly()" [ngModel]="draft().message" (ngModelChange)="updateDraft({ message: $event })"></textarea>
      </mat-form-field>
    }

    @if (draft().channel === 'webhook') {
      <div class="task-grid">
        <mat-form-field>
          <mat-label>{{ i18n.t('ui.url') }}</mat-label>
          <input matInput [disabled]="readonly()" [ngModel]="draft().url" (ngModelChange)="updateDraft({ url: $event })" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>{{ i18n.t('ui.timeoutSeconds') }}</mat-label>
          <input matInput [disabled]="readonly()" [ngModel]="draft().timeoutSeconds" (ngModelChange)="updateDraft({ timeoutSeconds: $event })" />
        </mat-form-field>
      </div>
      <mat-form-field class="full-width">
        <mat-label>{{ i18n.t('ui.message') }}</mat-label>
        <textarea matInput [disabled]="readonly()" [ngModel]="draft().message" (ngModelChange)="updateDraft({ message: $event })"></textarea>
      </mat-form-field>
      <mat-form-field class="full-width">
        <mat-label>{{ i18n.t('ui.headersJson') }}</mat-label>
        <textarea matInput [disabled]="readonly()" [ngModel]="draft().headersJson" (ngModelChange)="updateDraft({ headersJson: $event })"></textarea>
      </mat-form-field>
      <mat-form-field class="full-width">
        <mat-label>{{ i18n.t('ui.body') }}</mat-label>
        <textarea matInput [disabled]="readonly()" [ngModel]="draft().bodyTemplate" (ngModelChange)="updateDraft({ bodyTemplate: $event })"></textarea>
      </mat-form-field>
    }

    @if (draft().channel === 'email') {
      <div class="task-grid">
        <mat-form-field>
          <mat-label>{{ i18n.t('ui.to') }}</mat-label>
          <input matInput [disabled]="readonly()" [ngModel]="draft().to" (ngModelChange)="updateDraft({ to: $event })" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>{{ i18n.t('ui.subject') }}</mat-label>
          <input matInput [disabled]="readonly()" [ngModel]="draft().subject" (ngModelChange)="updateDraft({ subject: $event })" />
        </mat-form-field>
      </div>
      <mat-form-field class="full-width">
        <mat-label>{{ i18n.t('ui.body') }}</mat-label>
        <textarea matInput [disabled]="readonly()" [ngModel]="draft().body" (ngModelChange)="updateDraft({ body: $event })"></textarea>
      </mat-form-field>
    }
  `,
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
