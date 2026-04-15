import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  SourceDraft,
  SourceProviderDescriptor,
  SourceProviderType,
} from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { SourceFormModel, SourceTestResult } from '../../source.models';
import { SourceTypeFormHostComponent } from '../source-type-form/source-type-form-host.component';

@Component({
  selector: 'ih-source-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    SourceTypeFormHostComponent,
  ],
  template: `
    <section class="panel-card ih-drawer-editor">
      <div class="panel-body ih-drawer-editor__body">
        <div class="panel-topbar">
          <button mat-stroked-button type="button" (click)="close.emit()">
            {{ i18n.t('common.close') }}
          </button>
        </div>

        <div class="profile-stack">
          <div class="profile-header">
            <div class="profile-avatar">{{ providerLabel().slice(0, 1).toUpperCase() }}</div>
            <div class="profile-copy">
              <h3 class="profile-name">{{ i18n.t(titleKey()) }}</h3>
              <p class="profile-subtitle">{{ providerLabel() }}</p>
            </div>
          </div>
        </div>

        @if (readonly() && canEdit()) {
          <div class="panel-actions">
            <button mat-flat-button type="button" (click)="edit.emit()">
              {{ i18n.t('common.edit') }}
            </button>
            <button mat-stroked-button type="button" (click)="toggleActive.emit()">
              {{ form().active ? i18n.t('common.disable') : i18n.t('common.enable') }}
            </button>
          </div>
        }

        <form class="editor-form" (ngSubmit)="!readonly() && save.emit()">
          <section class="form-section">
            <div class="section-header">
              <p class="section-eyebrow">{{ i18n.t('ui.overview') }}</p>
              <h4>{{ i18n.t('sources.connectionProfile') }}</h4>
            </div>

            <div class="hero-grid">
              <mat-form-field class="field-span-2">
                <mat-label>{{ i18n.t('common.name') }}</mat-label>
                <input
                  matInput
                  [disabled]="readonly()"
                  [ngModel]="form().name"
                  (ngModelChange)="patchForm.emit({ name: $event })"
                  name="sourceName"
                />
              </mat-form-field>

              <mat-form-field>
                <mat-label>{{ i18n.t('common.type') }}</mat-label>
                <mat-select
                  [disabled]="readonly()"
                  [ngModel]="form().sourceType"
                  (ngModelChange)="sourceTypeChange.emit($event)"
                  name="sourceType"
                >
                  @for (provider of providerOptions(); track provider.type) {
                    <mat-option [value]="provider.type">{{ provider.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <div class="toggle-wrap">
                <mat-slide-toggle
                  [disabled]="readonly()"
                  [ngModel]="form().active"
                  (ngModelChange)="patchForm.emit({ active: $event })"
                  name="sourceActive"
                >
                  {{ i18n.t('common.active') }}
                </mat-slide-toggle>
              </div>
            </div>
          </section>

          <section class="form-section provider-section">
            <div class="section-header">
              <p class="section-eyebrow">{{ i18n.t('ui.provider') }}</p>
              <h4>{{ providerLabel() }}</h4>
            </div>
            <ih-source-type-form-host
              [sourceType]="form().sourceType"
              [draft]="draft()"
              [readonly]="readonly()"
              (patchDraft)="patchDraft.emit($event)"
            />
          </section>

          @if (testResult()) {
            <div class="test-result" [class.test-result--danger]="!testResult()!.success">
              {{ testResult()!.message }}
            </div>
          }

          @if (!readonly()) {
            <div class="form-actions">
              <button mat-stroked-button type="button" (click)="test.emit()" [disabled]="testing()">
                {{ testing() ? i18n.t('sources.testing') : i18n.t('sources.test') }}
              </button>
              <button mat-flat-button type="submit" [disabled]="saving()">
                {{ form().id ? i18n.t('common.saveChanges') : i18n.t('common.create') }}
              </button>
              <button mat-stroked-button type="button" (click)="cancel.emit()">
                {{ i18n.t('common.cancel') }}
              </button>
            </div>
          }
        </form>
      </div>
    </section>
  `,
  styles: [
    `
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
      }
      .profile-avatar {
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
      }
      .profile-eyebrow,
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
      }
      .profile-subtitle {
        margin: 0;
        color: var(--ih-text-soft);
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
      }
      .form-section {
        display: grid;
        gap: 0.9rem;
        padding: 0.95rem;
        border: 1px solid var(--ih-border);
        border-radius: 18px;
        background: color-mix(in srgb, var(--ih-surface-alt) 93%, transparent);
      }
      .section-header h4 {
        margin: 0.28rem 0 0;
        font-size: 1rem;
      }
      .hero-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.85rem;
        align-items: start;
      }
      .field-span-2 {
        grid-column: 1 / -1;
      }
      .toggle-wrap {
        display: flex;
        align-items: center;
        min-height: 52px;
      }
      .test-result {
        padding: 0.85rem 0.95rem;
        border-radius: 16px;
        background: rgba(22, 101, 52, 0.1);
        color: #166534;
        font-weight: 600;
      }
      .test-result--danger {
        background: rgba(185, 28, 28, 0.12);
        color: #b91c1c;
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
        .field-span-2 {
          grid-column: auto;
        }
      }
      @media (max-height: 700px) and (min-width: 761px) {
        .panel-body {
          padding: 0.85rem;
        }
        .panel-topbar {
          margin-bottom: 0.45rem;
        }
        .profile-stack {
          gap: 0.55rem;
          margin-bottom: 0.75rem;
        }
        .profile-avatar {
          width: 3.2rem;
          height: 3.2rem;
          border-radius: 18px;
          font-size: 1rem;
        }
        .profile-name {
          font-size: 1.2rem;
        }
        .panel-actions,
        .editor-form {
          gap: 0.7rem;
        }
        .form-section {
          gap: 0.7rem;
          padding: 0.8rem;
        }
      }
    `,
  ],
})
export class SourceEditorComponent {
  readonly i18n = inject(I18nService);

  readonly form = input.required<SourceFormModel>();
  readonly draft = input.required<SourceDraft>();
  readonly providerOptions = input.required<readonly SourceProviderDescriptor[]>();
  readonly saving = input(false);
  readonly testing = input(false);
  readonly titleKey = input.required<string>();
  readonly readonly = input(false);
  readonly canEdit = input(false);
  readonly testResult = input<SourceTestResult | null>(null);

  readonly patchForm = output<Partial<SourceFormModel>>();
  readonly sourceTypeChange = output<SourceProviderType>();
  readonly patchDraft = output<Partial<SourceDraft>>();
  readonly save = output<void>();
  readonly test = output<void>();
  readonly cancel = output<void>();
  readonly close = output<void>();
  readonly edit = output<void>();
  readonly toggleActive = output<void>();

  providerLabel(): string {
    return (
      this.providerOptions().find((provider) => provider.type === this.form().sourceType)
        ?.label ?? this.form().sourceType
    );
  }
}
