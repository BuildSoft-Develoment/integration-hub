// @trace spec 008-mensajeria-pagos RF-009, T-026
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  Mt101SplitTaskDraft,
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskFormModel } from '../../../../../models/process.models';
import { ProcessTaskRuntimePanelComponent } from '@integration-hub/shared/process-form-kit';
import { TaskFormShellComponent } from '@integration-hub/shared/process-form-kit';

@Component({
  selector: 'ih-process-mt101-split-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    ProcessTaskRuntimePanelComponent,
    TaskFormShellComponent,
  ],
  template: `
    <ih-task-form-shell [title]="i18n.t('processTask.MT101_SPLIT')">
      <ih-process-task-runtime-panel
        shellRuntime
        [task]="task()"
        [tasks]="tasks()"
        [draft]="draft()"
        [readonly]="readonly()"
        (runtimeChange)="updateDraft($event)"
      />

      <div class="tfs-body">
      <p class="mt101-split__description">{{ i18n.t('mt101Split.description') }}</p>

      <section class="mt101-split__section">
        <h4>{{ i18n.t('mt101Split.section.limits') }}</h4>
        <div class="mt101-split__grid">
          <mat-form-field subscriptSizing="dynamic">
            <mat-label>{{ i18n.t('mt101Split.maxTransactionsPerFragment') }}</mat-label>
            <input
              matInput
              type="number"
              min="1"
              [ngModel]="draft().maxTransactionsPerFragment"
              (ngModelChange)="updateDraft({ maxTransactionsPerFragment: $event })"
              [disabled]="readonly()" />
          </mat-form-field>

          <mat-form-field subscriptSizing="dynamic">
            <mat-label>{{ i18n.t('mt101Split.maxBytesPerFragment') }}</mat-label>
            <input
              matInput
              type="number"
              min="1"
              [ngModel]="draft().maxBytesPerFragment"
              (ngModelChange)="updateDraft({ maxBytesPerFragment: $event })"
              [disabled]="readonly()" />
          </mat-form-field>
        </div>
      </section>

      <section class="mt101-split__section">
        <h4>{{ i18n.t('mt101Split.section.metadata') }}</h4>
        <mat-checkbox
          [ngModel]="draft().rebuildIndexTotal"
          (ngModelChange)="updateDraft({ rebuildIndexTotal: $event })"
          [disabled]="readonly()">
          {{ i18n.t('mt101Split.rebuildIndexTotal') }}
        </mat-checkbox>

        <mat-form-field class="mt101-split__full" subscriptSizing="dynamic">
          <mat-label>{{ i18n.t('mt101Split.fragmentReferenceTemplate') }}</mat-label>
          <input
            matInput
            type="text"
            placeholder="\${sendersReference}-\${fragmentIndex}"
            [ngModel]="draft().fragmentReferenceTemplate"
            (ngModelChange)="updateDraft({ fragmentReferenceTemplate: $event })"
            [disabled]="readonly()" />
        </mat-form-field>
      </section>
      </div>
    </ih-task-form-shell>
  `,
  styleUrl: './process-mt101-split-task-form.component.css',
})
export class ProcessMt101SplitTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly readonly = input(false);

  readonly draft = computed<Mt101SplitTaskDraft>(
    () => this.manager.draftFor<Mt101SplitTaskDraft>(this.task()),
  );

  updateDraft(patch: Partial<Mt101SplitTaskDraft>): void {
    const next: Mt101SplitTaskDraft = { ...this.draft(), ...patch };
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, next));
  }
}
