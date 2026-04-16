import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { I18nService } from '@integration-hub/core/services';

import { ProcessFormModel } from '../../process.models';

@Component({
  selector: 'ih-process-editor-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  template: `
    <section class="form-section">
      <div class="section-header">
        <p class="section-eyebrow">{{ i18n.t('ui.overview') }}</p>
        <h4>{{ i18n.t('processes.definitionProfile') }}</h4>
      </div>

      <div class="hero-grid">
        <mat-form-field>
          <mat-label>{{ i18n.t('common.name') }}</mat-label>
          <input
            matInput
            [disabled]="readonly()"
            [ngModel]="form().name"
            (ngModelChange)="patchForm.emit({ name: $event })"
            name="processName"
          />
        </mat-form-field>

        <mat-form-field>
          <mat-label>{{ i18n.t('processes.description') }}</mat-label>
          <input
            matInput
            [disabled]="readonly()"
            [ngModel]="form().description"
            (ngModelChange)="patchForm.emit({ description: $event })"
            name="processDescription"
          />
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
            {{
              form().active
                ? i18n.t('status.active')
                : i18n.t('status.inactive')
            }}
          </mat-slide-toggle>
        </div>

        <div class="toggle-field">
          <mat-slide-toggle
            [disabled]="readonly()"
            [ngModel]="form().scheduled"
            (ngModelChange)="patchForm.emit({ scheduled: $event })"
            name="processScheduled"
          >
            {{
              form().scheduled
                ? i18n.t('status.scheduled')
                : i18n.t('status.manual')
            }}
          </mat-slide-toggle>
        </div>

        <mat-form-field>
          <mat-label>{{ i18n.t('processes.frequency') }}</mat-label>
          <input
            matInput
            [disabled]="readonly() || !form().scheduled"
            [ngModel]="form().scheduleEvery"
            (ngModelChange)="patchForm.emit({ scheduleEvery: $event })"
            name="processScheduleEvery"
            placeholder="5M"
          />
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
  `,
  styles: [
    `
      .form-section {
        display: grid;
        gap: 0.9rem;
        padding: 0.95rem;
        border: 1px solid var(--ih-border);
        border-radius: 18px;
        background: color-mix(in srgb, var(--ih-surface-alt) 93%, transparent);
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
      @media (max-width: 900px) {
        .hero-grid,
        .hero-grid--secondary {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 760px) {
        .form-section {
          padding: 0.8rem;
          border-radius: 16px;
        }
        .toggle-field {
          padding-top: 0;
        }
      }
    `,
  ],
})
export class ProcessEditorOverviewComponent {
  readonly i18n = inject(I18nService);

  readonly form = input.required<ProcessFormModel>();
  readonly readonly = input(false);

  readonly patchForm = output<Partial<ProcessFormModel>>();
}
