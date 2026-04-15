import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ConnectionRef, ProcessTaskFormModel, ProcessTaskType, ReaderRef, SourceRef } from '../../process.models';
import { ProcessTaskFormHostComponent } from '../process-task-form/process-task-form-host.component';

@Component({
  selector: 'ih-process-task-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    ProcessTaskFormHostComponent,
  ],
  template: `
    <div class="task-modal-backdrop" (click)="close.emit()"></div>

    <section class="task-modal-card" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
      <header class="task-modal-header">
        <div class="task-modal-copy">
          <p class="section-eyebrow">{{ i18n.t('ui.provider') }}</p>
          <h3>{{ i18n.t('ui.task', { index: index() + 1 }) }}</h3>
          <p class="task-modal-summary">{{ taskTypeLabel(task().taskType) }}</p>
        </div>

        <div class="task-modal-actions">
          <button mat-icon-button type="button" (click)="close.emit()" [attr.aria-label]="i18n.t('common.close')">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6 18 18M18 6 6 18" />
            </svg>
          </button>
        </div>
      </header>

      <div
        class="task-modal-body"
        [class.task-modal-body--workspace]="usesWorkspaceLayout()"
        [class.task-modal-body--rest]="isRestTask()"
      >
        <section
          class="task-modal-section"
          [class.task-modal-section--workspace]="usesWorkspaceLayout()"
          [class.task-modal-section--rest]="isRestTask()"
        >
          <ih-process-task-form-host
            [task]="task()"
            [tasks]="tasks()"
            [sources]="sources()"
            [readers]="readers()"
            [connections]="connections()"
            [readonly]="readonly()"
            (patchTask)="patchTask.emit($event)"
          />
        </section>
      </div>
    </section>
  `,
  styles: [`
      :host {
        inset: 0;
        z-index: 80;
        overflow: hidden;
      }
      .task-modal-backdrop {
        position: absolute;
        inset: 0;
        background: color-mix(in srgb, var(--ih-background) 52%, rgba(15, 23, 42, 0.52));
        backdrop-filter: blur(4px);
      }
      .task-modal-card {
        position: absolute;
        inset: 0;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        min-width: 0;
        border-radius: 0;
        border: 0;
        background: color-mix(in srgb, var(--ih-surface) 96%, transparent);
        box-shadow: none;
        overflow: hidden;
      }
      .task-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 1rem;
        min-width: 0;
        padding: 1rem 1rem 0.9rem;
        border-bottom: 1px solid var(--ih-border);
        background: color-mix(in srgb, var(--ih-surface-alt) 94%, transparent);
      }
      .task-modal-copy {
        display: grid;
        gap: 0.25rem;
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
      .task-modal-copy h3 {
        margin: 0;
        overflow-wrap: anywhere;
      }
      .task-modal-summary {
        margin: 0;
        color: var(--ih-text-soft);
        overflow-wrap: anywhere;
      }
      .task-modal-actions {
        display: flex;
        gap: 0.55rem;
        align-items: center;
        flex: 0 0 auto;
      }
      .task-modal-actions button[mat-icon-button] {
        color: var(--ih-text);
      }
      .task-modal-actions button[mat-icon-button] svg {
        width: 1rem;
        height: 1rem;
        stroke: currentColor;
        fill: none;
        stroke-width: 2.2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .task-modal-body {
        min-height: 0;
        min-width: 0;
        display: grid;
        grid-template-rows: minmax(0, 1fr);
        gap: 0.95rem;
        padding: 1rem;
        overflow: auto hidden;
      }
      .task-modal-section {
        display: grid;
        gap: 0.85rem;
        padding: 0.95rem;
        border: 1px solid var(--ih-border);
        border-radius: 18px;
        background: color-mix(in srgb, var(--ih-surface-alt) 93%, transparent);
        min-width: 0;
        overflow: visible hidden;
      }
      .task-modal-body--workspace {
        overflow: hidden;
      }
      .task-modal-section--workspace {
        min-height: 0;
        height: 100%;
        overflow: hidden;
      }
      .task-modal-body--rest {
        overflow: hidden;
      }
      .task-modal-section--rest {
        overflow: auto;
      }
      .task-modal-section ::ng-deep .mat-mdc-form-field,
      .task-modal-section ::ng-deep .mat-mdc-form-field-flex,
      .task-modal-section ::ng-deep .mat-mdc-text-field-wrapper,
      .task-modal-section ::ng-deep .mat-mdc-form-field-infix,
      .task-modal-section ::ng-deep .mat-mdc-tab-group,
      .task-modal-section ::ng-deep .mat-mdc-tab-body-wrapper,
      .task-modal-section ::ng-deep .mat-mdc-tab-body,
      .task-modal-section ::ng-deep .mat-mdc-tab-body-content {
        min-width: 0 !important;
        max-width: 100% !important;
      }
      .task-modal-section ::ng-deep .mat-mdc-form-field {
        width: 100%;
      }
      @media (max-width: 760px) {
        .task-modal-header {
          padding: 0.85rem 0.85rem 0.8rem;
        }
        .task-modal-body {
          padding: 0.85rem;
          overflow: auto;
          grid-template-rows: auto;
        }
        .task-modal-section {
          height: auto;
          min-height: auto;
          padding: 0.8rem;
          border-radius: 16px;
          overflow: visible;
        }
      }
    `],
})
export class ProcessTaskModalComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly index = input(0);
  readonly sources = input.required<readonly SourceRef[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly connections = input.required<readonly ConnectionRef[]>();
  readonly readonly = input(false);

  readonly patchTask = output<Partial<ProcessTaskFormModel>>();
  readonly close = output<void>();

  taskTypeLabel(taskType: ProcessTaskType): string {
    return this.manager.label(taskType);
  }

  usesWorkspaceLayout(): boolean {
    return this.task().taskType === 'DB_WRITE'
      || this.task().taskType === 'DB_EXECUTE_SP'
      || this.task().taskType === 'DB_EXECUTE_FN'
      || this.task().taskType === 'REST_CALL';
  }

  isRestTask(): boolean {
    return this.task().taskType === 'REST_CALL';
  }
}
