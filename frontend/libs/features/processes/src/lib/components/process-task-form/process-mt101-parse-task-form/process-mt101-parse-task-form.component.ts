// @trace spec 008-mensajeria-pagos RF-008, T-021
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Mt101ParseTaskDraft,
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskFormModel } from '../../../models/process.models';

@Component({
  selector: 'ih-process-mt101-parse-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mt101-parse">
      <header class="mt101-parse__header">
        <h3>{{ i18n.t('processTask.MT101_PARSE') }}</h3>
      </header>

      <p class="mt101-parse__description">{{ i18n.t('mt101Parse.description') }}</p>

      <section class="mt101-parse__section">
        <label class="mt101-parse__toggle">
          <input
            type="checkbox"
            [ngModel]="draft().interpretSequenceAB"
            (ngModelChange)="updateDraft({ interpretSequenceAB: $event })"
            [disabled]="readonly()" />
          <span>{{ i18n.t('mt101Parse.interpretSequenceAB') }}</span>
        </label>
        <p class="mt101-parse__hint">{{ i18n.t('mt101Parse.interpretSequenceABHint') }}</p>
      </section>

      <section class="mt101-parse__section">
        <label class="mt101-parse__toggle" [class.mt101-parse__toggle--disabled]="true">
          <input
            type="checkbox"
            [ngModel]="draft().publishMultiOutput"
            [disabled]="true" />
          <span>{{ i18n.t('mt101Parse.publishMultiOutput') }}</span>
        </label>
        <p class="mt101-parse__hint mt101-parse__hint--warn">
          {{ i18n.t('mt101Parse.publishMultiOutputBlocked') }}
        </p>
      </section>
    </div>
  `,
  styles: [
    `
      .mt101-parse { display: flex; flex-direction: column; gap: 1rem; padding: 1rem; }
      .mt101-parse__header { padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-border, #e2e8f0); }
      .mt101-parse__header h3 { margin: 0; font-size: 1.05rem; font-weight: 600; }
      .mt101-parse__description { margin: 0; font-size: 0.85rem; color: var(--color-text-muted, #475569); }
      .mt101-parse__section { display: flex; flex-direction: column; gap: 0.3rem; }
      .mt101-parse__toggle { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
      .mt101-parse__toggle--disabled { opacity: 0.5; cursor: not-allowed; }
      .mt101-parse__hint { margin: 0; font-size: 0.8rem; color: var(--color-text-muted, #475569); }
      .mt101-parse__hint--warn { color: #b45309; }
    `,
  ],
})
export class ProcessMt101ParseTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);

  readonly task = input.required<ProcessTaskFormModel>();
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
