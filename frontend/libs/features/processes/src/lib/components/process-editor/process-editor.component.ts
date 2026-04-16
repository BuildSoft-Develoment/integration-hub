import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { I18nService } from '@integration-hub/core/services';
import { ProcessFlowLayout } from '../../process-flow.models';
import { ConnectionRef, ProcessFormModel, ProcessTaskFormModel, ProcessTaskType, ReaderRef, SourceRef } from '../../process.models';
import { ProcessEditorActionsComponent } from './process-editor-actions.component';
import { ProcessEditorHeaderComponent } from './process-editor-header.component';
import { ProcessEditorOverviewComponent } from './process-editor-overview.component';
import { ProcessTaskListComponent } from '../process-task-list/process-task-list.component';

@Component({
  selector: 'ih-process-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    ProcessEditorActionsComponent,
    ProcessEditorHeaderComponent,
    ProcessEditorOverviewComponent,
    ProcessTaskListComponent,
  ],
  template: `
    <section class="panel-card">
      <div class="panel-body">
        <ih-process-editor-header
          [titleKey]="titleKey()"
          [scheduled]="form().scheduled"
          (close)="close.emit()"
        />

        @if (readonly()) {
          <ih-process-editor-actions
            [active]="form().active"
            [canEdit]="canEdit()"
            [canOperate]="canOperate()"
            [executing]="executing()"
            (edit)="edit.emit()"
            (toggleActive)="toggleActive.emit()"
            (execute)="execute.emit()"
          />
        }

        <form class="editor-form" (ngSubmit)="!readonly() && save.emit()">
          <ih-process-editor-overview
            [form]="form()"
            [readonly]="readonly()"
            (patchForm)="patchForm.emit($event)"
          />

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
      .form-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        padding-top: 0.15rem;
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
        .form-section {
          padding: 0.8rem;
          border-radius: 16px;
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
