// @trace spec 008-mensajeria-pagos RF-009, T-026
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Mt101SplitTaskDraft,
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskFormModel } from '../../../models/process.models';
import { ProcessTaskRuntimePanelComponent } from '../process-task-runtime-panel/process-task-runtime-panel.component';

@Component({
  selector: 'ih-process-mt101-split-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ProcessTaskRuntimePanelComponent],
  template: `
    <div class="mt101-split">
      <header class="mt101-split__header"><h3>{{ i18n.t('processTask.MT101_SPLIT') }}</h3></header>

      <ih-process-task-runtime-panel
        [task]="task()"
        [tasks]="tasks()"
        [draft]="draft()"
        [readonly]="readonly()"
        (runtimeChange)="updateDraft($event)"
      />

      <p class="mt101-split__description">{{ i18n.t('mt101Split.description') }}</p>

      <section class="mt101-split__section">
        <h4>{{ i18n.t('mt101Split.section.limits') }}</h4>
        <div class="mt101-split__grid">
          <label>
            <span>{{ i18n.t('mt101Split.maxTransactionsPerFragment') }}</span>
            <input
              type="number"
              min="1"
              [ngModel]="draft().maxTransactionsPerFragment"
              (ngModelChange)="updateDraft({ maxTransactionsPerFragment: $event })"
              [disabled]="readonly()" />
          </label>
          <label>
            <span>{{ i18n.t('mt101Split.maxBytesPerFragment') }}</span>
            <input
              type="number"
              min="1"
              [ngModel]="draft().maxBytesPerFragment"
              (ngModelChange)="updateDraft({ maxBytesPerFragment: $event })"
              [disabled]="readonly()" />
          </label>
        </div>
      </section>

      <section class="mt101-split__section">
        <h4>{{ i18n.t('mt101Split.section.metadata') }}</h4>
        <label class="mt101-split__toggle">
          <input
            type="checkbox"
            [ngModel]="draft().rebuildIndexTotal"
            (ngModelChange)="updateDraft({ rebuildIndexTotal: $event })"
            [disabled]="readonly()" />
          <span>{{ i18n.t('mt101Split.rebuildIndexTotal') }}</span>
        </label>
        <label class="mt101-split__full">
          <span>{{ i18n.t('mt101Split.fragmentReferenceTemplate') }}</span>
          <input
            type="text"
            placeholder="\${sendersReference}-\${fragmentIndex}"
            [ngModel]="draft().fragmentReferenceTemplate"
            (ngModelChange)="updateDraft({ fragmentReferenceTemplate: $event })"
            [disabled]="readonly()" />
        </label>
      </section>
    </div>
  `,
  styles: [`
    .mt101-split { display: flex; flex-direction: column; gap: 1.25rem; padding: 1rem; }
    .mt101-split__header { padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-border, #e2e8f0); }
    .mt101-split__header h3 { margin: 0; font-size: 1.05rem; font-weight: 600; }
    .mt101-split__description { margin: 0; font-size: 0.85rem; color: var(--color-text-muted, #475569); }
    .mt101-split__section { display: flex; flex-direction: column; gap: 0.6rem; }
    .mt101-split__section h4 {
      margin: 0; font-size: 0.9rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.04em;
      color: var(--color-text-muted, #475569);
    }
    .mt101-split__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem 1rem; }
    .mt101-split__grid > label, .mt101-split__full { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; }
    .mt101-split__grid input, .mt101-split__full input {
      width: 100%; padding: 0.4rem 0.6rem;
      border: 1px solid var(--color-border, #cbd5e1); border-radius: 4px;
      background: var(--color-surface, #ffffff);
    }
    .mt101-split__toggle { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
    input:disabled { background: var(--color-surface-muted, #f1f5f9); opacity: 0.7; }
  `],
})
export class ProcessMt101SplitTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly readonly = input(false);

  readonly draft = computed<Mt101SplitTaskDraft>(
    () => this.manager.hydrateDraft<Mt101SplitTaskDraft>(this.task()) ?? this.defaultDraft(),
  );

  updateDraft(patch: Partial<Mt101SplitTaskDraft>): void {
    const next: Mt101SplitTaskDraft = { ...this.draft(), ...patch };
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, next));
  }

  private defaultDraft(): Mt101SplitTaskDraft {
    return {
      taskRef: this.task().clientId,
      executionMode: 'once',
      maxTransactionsPerFragment: 100,
      maxBytesPerFragment: 10000,
      rebuildIndexTotal: true,
      fragmentReferenceTemplate: '${sendersReference}-${fragmentIndex}',
    };
  }
}
