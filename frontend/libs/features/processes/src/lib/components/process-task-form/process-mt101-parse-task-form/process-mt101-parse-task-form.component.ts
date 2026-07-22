// @trace spec 008-mensajeria-pagos RF-008, T-021
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  Mt101ParseTaskDraft,
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskFormModel } from '../../../models/process.models';
import { ProcessTaskRuntimePanelComponent } from '../process-task-runtime-panel/process-task-runtime-panel.component';
import { TaskFormShellComponent } from '../task-form-shell/task-form-shell.component';

@Component({
  selector: 'ih-process-mt101-parse-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCheckboxModule, ProcessTaskRuntimePanelComponent, TaskFormShellComponent],
  template: `
    <ih-task-form-shell [title]="i18n.t('processTask.MT101_PARSE')">
      <ih-process-task-runtime-panel
        shellRuntime
        [task]="task()"
        [tasks]="tasks()"
        [draft]="draft()"
        [readonly]="readonly()"
        (runtimeChange)="updateDraft($event)"
      />

      <div class="tfs-body">
      <p class="mt101-parse__description">{{ i18n.t('mt101Parse.description') }}</p>

      <section class="mt101-parse__section">
        <mat-checkbox
          [ngModel]="draft().interpretSequenceAB"
          (ngModelChange)="updateDraft({ interpretSequenceAB: $event })"
          [disabled]="readonly()">
          {{ i18n.t('mt101Parse.interpretSequenceAB') }}
        </mat-checkbox>
        <p class="mt101-parse__hint">{{ i18n.t('mt101Parse.interpretSequenceABHint') }}</p>
      </section>

      <section class="mt101-parse__section">
        <mat-checkbox [ngModel]="draft().publishMultiOutput" [disabled]="true">
          {{ i18n.t('mt101Parse.publishMultiOutput') }}
        </mat-checkbox>
        <p class="mt101-parse__hint mt101-parse__hint--warn">
          {{ i18n.t('mt101Parse.publishMultiOutputBlocked') }}
        </p>
      </section>
      </div>
    </ih-task-form-shell>
  `,
  styles: [
    `
      /* El scroll wrapper y el header los provee ih-task-form-shell (.tfs-body + header). */
      :host { display: block; min-width: 0; min-height: 0; height: 100%; overflow: hidden; }
      .mt101-parse__description {
        margin: 0;
        color: var(--ih-text-soft, var(--color-text-muted, #475569));
        font-size: 0.85rem;
      }
      .mt101-parse__section { display: flex; flex-direction: column; gap: 0.3rem; }
      .mt101-parse__hint {
        margin: 0;
        color: var(--ih-text-soft, var(--color-text-muted, #475569));
        font-size: 0.8rem;
      }
      .mt101-parse__hint--warn { color: #b45309; }
    `,
  ],
})
export class ProcessMt101ParseTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly readonly = input(false);

  readonly draft = computed<Mt101ParseTaskDraft>(
    () => this.manager.hydrateDraft<Mt101ParseTaskDraft>(this.task()) ?? this.defaultDraft(),
  );

  updateDraft(patch: Partial<Mt101ParseTaskDraft>): void {
    const next: Mt101ParseTaskDraft = { ...this.draft(), ...patch };
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, next));
  }

  private defaultDraft(): Mt101ParseTaskDraft {
    return {
      taskRef: this.task().clientId,
      executionMode: 'once',
      interpretSequenceAB: true,
      publishMultiOutput: false,
    };
  }
}
