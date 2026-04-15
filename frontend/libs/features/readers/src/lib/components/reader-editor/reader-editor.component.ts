import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  ReaderDraft,
  ReaderProviderDescriptor,
  ReaderProviderType,
} from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { ReaderFormModel } from '../../reader.models';
import { ReaderTypeFormHostComponent } from '../reader-type-form/reader-type-form-host.component';

@Component({
  selector: 'ih-reader-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule, ReaderTypeFormHostComponent],
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
              <h4>{{ i18n.t('readers.definitionProfile') }}</h4>
            </div>

            <div class="hero-grid">
              <mat-form-field class="field-span-2">
                <mat-label>{{ i18n.t('common.name') }}</mat-label>
                <input
                  matInput
                  [disabled]="readonly()"
                  [ngModel]="form().name"
                  (ngModelChange)="patchForm.emit({ name: $event })"
                  name="readerName"
                />
              </mat-form-field>

              <mat-form-field>
                <mat-label>{{ i18n.t('common.type') }}</mat-label>
                <mat-select
                  [disabled]="readonly()"
                  [ngModel]="form().readerType"
                  (ngModelChange)="readerTypeChange.emit($event)"
                  name="readerType"
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
                  name="readerActive"
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
            <ih-reader-type-form-host
              [readerType]="form().readerType"
              [draft]="draft()"
              [readonly]="readonly()"
              (patchDraft)="patchDraft.emit($event)"
            />
          </section>

          @if (!readonly()) {
            <div class="form-actions">
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
      .hero-grid mat-form-field,
      .provider-section mat-form-field {
        width: 100%;
        min-width: 0;
      }
      .field-span-2 {
        grid-column: 1 / -1;
      }
      .toggle-wrap {
        display: flex;
        align-items: center;
        min-height: 52px;
        min-width: 0;
      }
      .form-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        padding-top: 0.15rem;
      }
      @media (max-width: 900px) {
        .panel-body {
          padding: 0.9rem;
        }
        .hero-grid {
          grid-template-columns: 1fr;
        }
        .field-span-2 {
          grid-column: auto;
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
      }
    `,
  ],
})
export class ReaderEditorComponent {
  readonly i18n = inject(I18nService);

  readonly form = input.required<ReaderFormModel>();
  readonly draft = input.required<ReaderDraft>();
  readonly providerOptions = input.required<readonly ReaderProviderDescriptor[]>();
  readonly saving = input(false);
  readonly titleKey = input.required<string>();
  readonly readonly = input(false);
  readonly canEdit = input(false);

  readonly patchForm = output<Partial<ReaderFormModel>>();
  readonly readerTypeChange = output<ReaderProviderType>();
  readonly patchDraft = output<Partial<ReaderDraft>>();
  readonly save = output<void>();
  readonly cancel = output<void>();
  readonly close = output<void>();
  readonly edit = output<void>();
  readonly toggleActive = output<void>();

  providerLabel(): string {
    return (
      this.providerOptions().find((provider) => provider.type === this.form().readerType)
        ?.label ?? this.form().readerType
    );
  }
}





