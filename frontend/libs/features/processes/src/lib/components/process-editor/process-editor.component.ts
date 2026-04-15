import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { I18nService } from '@integration-hub/core/services';
import { ProcessFlowLayout } from '../../process-flow.models';
import { ConnectionRef, ProcessFormModel, ProcessTaskFormModel, ProcessTaskType, ReaderRef, SourceRef } from '../../process.models';
import { ProcessTaskListComponent } from '../process-task-list/process-task-list.component';

@Component({
  selector: 'ih-process-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, ProcessTaskListComponent],
  template: `
    <section class="panel-card">
      <div class="panel-body">
        <div class="panel-topbar">
          <button mat-stroked-button type="button" (click)="close.emit()">
            {{ i18n.t('common.close') }}
          </button>
        </div>

        <div class="profile-stack">
          <div class="profile-header">
            <div class="profile-avatar">P</div>
            <div class="profile-copy">
              <h3 class="profile-name">{{ i18n.t(titleKey()) }}</h3>
              <p class="profile-subtitle">{{ form().scheduled ? i18n.t('status.scheduled') : i18n.t('status.manual') }}</p>
            </div>
          </div>
        </div>

        @if (readonly()) {
          <div class="panel-actions">
            @if (canEdit()) {
              <button mat-flat-button type="button" (click)="edit.emit()">{{ i18n.t('common.edit') }}</button>
              <button mat-stroked-button type="button" (click)="toggleActive.emit()">{{ form().active ? i18n.t('common.disable') : i18n.t('common.enable') }}</button>
            }
            @if (canOperate()) {
              <button mat-stroked-button type="button" (click)="execute.emit()" [disabled]="executing()">{{ executing() ? i18n.t('processes.running') : i18n.t('processes.run') }}</button>
            }
          </div>
        }

        <form class="editor-form" (ngSubmit)="!readonly() && save.emit()">
          <section class="form-section">
            <div class="section-header">
              <p class="section-eyebrow">{{ i18n.t('ui.overview') }}</p>
              <h4>{{ i18n.t('processes.definitionProfile') }}</h4>
            </div>

            <div class="hero-grid">
              <mat-form-field>
                <mat-label>{{ i18n.t('common.name') }}</mat-label>
                <input matInput [disabled]="readonly()" [ngModel]="form().name" (ngModelChange)="patchForm.emit({ name: $event })" name="processName" />
              </mat-form-field>

              <mat-form-field>
                <mat-label>{{ i18n.t('processes.description') }}</mat-label>
                <input matInput [disabled]="readonly()" [ngModel]="form().description" (ngModelChange)="patchForm.emit({ description: $event })" name="processDescription" />
              </mat-form-field>
            </div>

            <div class="hero-grid hero-grid--secondary">
              <div class="toggle-field">
                <mat-slide-toggle
                  [disabled]="readonly()"
                  [ngModel]="form().active"
                  (ngModelChange)="patchForm.emit({ active: $event })"
                  name="processActive"
                >
                  {{ form().active ? i18n.t('status.active') : i18n.t('status.inactive') }}
                </mat-slide-toggle>
              </div>

              <div class="toggle-field">
                <mat-slide-toggle
                  [disabled]="readonly()"
                  [ngModel]="form().scheduled"
                  (ngModelChange)="patchForm.emit({ scheduled: $event })"
                  name="processScheduled"
                >
                  {{ form().scheduled ? i18n.t('status.scheduled') : i18n.t('status.manual') }}
                </mat-slide-toggle>
              </div>

              <mat-form-field>
                <mat-label>{{ i18n.t('processes.frequency') }}</mat-label>
                <input matInput [disabled]="readonly() || !form().scheduled" [ngModel]="form().scheduleEvery" (ngModelChange)="patchForm.emit({ scheduleEvery: $event })" name="processScheduleEvery" placeholder="5M" />
              </mat-form-field>
            </div>

            @if (readonly()) {
              <div class="hero-grid">
                <mat-form-field>
                  <mat-label>{{ i18n.t('processes.nextRunAt') }}</mat-label>
                  <input matInput [value]="form().nextRunAt || ''" disabled />
                </mat-form-field>

                <mat-form-field>
                  <mat-label>{{ i18n.t('processes.lastRunAt') }}</mat-label>
                  <input matInput [value]="form().lastRunAt || ''" disabled />
                </mat-form-field>
              </div>
            }
          </section>

          <section class="form-section">
            <ih-process-task-list
              [tasks]="form().tasks"
              [flowLayout]="form().flowLayout"
              [sources]="sources()"
              [readers]="readers()"
              [connections]="connections()"
              [readonly]="readonly()"
              (addTask)="addTask.emit($event)"
              (addTaskAt)="addTaskAt.emit($event)"
              (flowLayoutChange)="flowLayoutChange.emit($event)"
              (flowStateChange)="flowStateChange.emit($event)"
              (patchTask)="patchTask.emit($event)"
              (removeTask)="removeTask.emit($event)"
            />
          </section>

          @if (!readonly()) {
            <div class="form-actions">
              <button mat-flat-button type="submit" [disabled]="saving()">{{ form().id ? i18n.t('common.saveChanges') : i18n.t('common.create') }}</button>
              <button mat-stroked-button type="button" (click)="cancel.emit()">{{ i18n.t('common.cancel') }}</button>
            </div>
          }
        </form>
      </div>
    </section>
  `,
  styles: [`
      .panel-card {
        min-height: 100%;
        height: 100%;
      }
      .panel-body {
        min-height: 100%;
        display: grid;
        align-content: start;
        padding: 1rem;
        overflow: auto;
      }
      .panel-topbar {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 0.65rem;
      }
      .profile-stack {
        display: grid;
        gap: 0.8rem;
        margin-bottom: 1rem;
      }
      .profile-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        min-width: 0;
      }
      .profile-avatar {
        flex: 0 0 auto;
        display: grid;
        place-items: center;
        width: 4rem;
        height: 4rem;
        border-radius: 22px;
        background: color-mix(in srgb, var(--ih-accent) 14%, transparent);
        color: var(--ih-accent-strong);
        font-size: 1.2rem;
        font-weight: 800;
      }
      .profile-copy {
        display: grid;
        gap: 0.28rem;
        min-width: 0;
      }
      .section-eyebrow {
        margin: 0;
        font-size: 0.74rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--ih-text-soft);
      }
      .profile-name {
        margin: 0;
        font-size: 1.45rem;
        font-weight: 700;
        letter-spacing: -0.03em;
        overflow-wrap: anywhere;
      }
      .profile-subtitle {
        margin: 0;
        color: var(--ih-text-soft);
        overflow-wrap: anywhere;
      }
      .panel-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-bottom: 0.9rem;
      }
      .editor-form {
        display: grid;
        gap: 0.9rem;
        min-width: 0;
      }
      .form-section {
        display: grid;
        gap: 0.9rem;
        padding: 0.95rem;
        border: 1px solid var(--ih-border);
        border-radius: 18px;
        background: color-mix(in srgb, var(--ih-surface-alt) 93%, transparent);
        min-width: 0;
      }
      .section-header h4 {
        margin: 0.28rem 0 0;
        font-size: 1rem;
        overflow-wrap: anywhere;
      }
      .hero-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.85rem;
        align-items: start;
        min-width: 0;
      }
      .hero-grid--secondary {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .toggle-field {
        display: grid;
        gap: 0;
        min-width: 0;
        align-content: start;
        padding-top: 0.15rem;
      }
      .form-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        padding-top: 0.15rem;
      }
      @media (max-width: 900px) {
        .hero-grid {
          grid-template-columns: 1fr;
        }
        .hero-grid--secondary {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 760px) {
        .panel-card {
          min-height: auto;
          height: auto;
        }
        .panel-body {
          min-height: auto;
          padding: 0.8rem;
          overflow: visible;
        }
        .profile-header {
          align-items: flex-start;
          gap: 0.75rem;
        }
        .profile-avatar {
          width: 3.25rem;
          height: 3.25rem;
          border-radius: 18px;
          font-size: 1rem;
        }
        .profile-name {
          font-size: 1.2rem;
        }
        .form-section {
          padding: 0.8rem;
          border-radius: 16px;
        }
        .toggle-field {
          padding-top: 0;
        }
      }
    `],
})
export class ProcessEditorComponent {
  readonly i18n = inject(I18nService);

  readonly form = input.required<ProcessFormModel>();
  readonly sources = input.required<readonly SourceRef[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly connections = input.required<readonly ConnectionRef[]>();
  readonly saving = input(false);
  readonly executing = input(false);
  readonly titleKey = input.required<string>();
  readonly readonly = input(false);
  readonly canEdit = input(false);
  readonly canOperate = input(false);

  readonly patchForm = output<Partial<ProcessFormModel>>();
  readonly flowLayoutChange = output<ProcessFlowLayout>();
  readonly flowStateChange = output<{ layout: ProcessFlowLayout; tasks: ProcessTaskFormModel[] }>();
  readonly addTask = output<ProcessTaskType>();
  readonly addTaskAt = output<{ taskType: ProcessTaskType; position?: { x: number; y: number } }>();
  readonly patchTask = output<{ clientId: string; patch: Partial<ProcessTaskFormModel> }>();
  readonly removeTask = output<string>();
  readonly save = output<void>();
  readonly cancel = output<void>();
  readonly close = output<void>();
  readonly edit = output<void>();
  readonly toggleActive = output<void>();
  readonly execute = output<void>();
}
