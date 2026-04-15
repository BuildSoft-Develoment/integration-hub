import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReaderFieldDraft, ReaderFieldVariant } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { ReaderScriptHelpComponent } from './reader-script-help.component';

@Component({
  selector: 'ih-reader-field-definition-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReaderScriptHelpComponent,
  ],
  template: `
    <mat-expansion-panel
      class="field-panel"
      [class.field-panel--active]="active()"
      [expanded]="expanded()"
      (opened)="opened.emit()"
      (closed)="closed.emit()"
      (click)="activated.emit()"
      (focusin)="activated.emit()"
    >
      <mat-expansion-panel-header class="field-panel__header" (click)="activated.emit()">
        <mat-panel-title>
          {{ field().name || i18n.t('ui.field', { index: index() + 1 }) }}
        </mat-panel-title>
        <mat-panel-description>
          {{ summary() }}
        </mat-panel-description>
      </mat-expansion-panel-header>

      <div class="field-grid">
        <mat-form-field>
          <mat-label>{{ i18n.t('ui.fieldName') }}</mat-label>
          <input matInput [disabled]="readonly()" [ngModel]="field().name" (ngModelChange)="update.emit({ name: $event })" />
        </mat-form-field>

        @if (variant() === 'range') {
          <mat-form-field>
            <mat-label>{{ i18n.t('ui.start') }}</mat-label>
            <input matInput [disabled]="readonly()" [ngModel]="field().start" (ngModelChange)="update.emit({ start: $event })" />
          </mat-form-field>

          <mat-form-field>
            <mat-label>{{ i18n.t('ui.end') }}</mat-label>
            <input matInput [disabled]="readonly()" [ngModel]="field().end" (ngModelChange)="update.emit({ end: $event })" />
          </mat-form-field>

          <mat-form-field>
            <mat-label>{{ i18n.t('ui.type') }}</mat-label>
            <mat-select [disabled]="readonly()" [ngModel]="field().type" (ngModelChange)="update.emit({ type: $event })">
              <mat-option value="TEXT">TEXT</mat-option>
              <mat-option value="NUMBER">NUMBER</mat-option>
              <mat-option value="DATE">DATE</mat-option>
            </mat-select>
          </mat-form-field>
        } @else {
          <mat-form-field>
            <mat-label>{{ i18n.t('ui.position') }}</mat-label>
            <input matInput [disabled]="readonly()" [ngModel]="field().position" (ngModelChange)="update.emit({ position: $event })" />
          </mat-form-field>

          <mat-form-field>
            <mat-label>{{ i18n.t('ui.type') }}</mat-label>
            <mat-select [disabled]="readonly()" [ngModel]="field().type" (ngModelChange)="update.emit({ type: $event })">
              <mat-option value="TEXT">TEXT</mat-option>
              <mat-option value="NUMBER">NUMBER</mat-option>
              <mat-option value="DATE">DATE</mat-option>
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field>
          <mat-label>{{ i18n.t('ui.size') }}</mat-label>
          <input matInput [disabled]="readonly()" [ngModel]="field().size" (ngModelChange)="update.emit({ size: $event })" />
        </mat-form-field>

        <mat-form-field>
          <mat-label>{{ i18n.t('ui.datePattern') }}</mat-label>
          <input matInput [disabled]="readonly()" [ngModel]="field().pattern" (ngModelChange)="update.emit({ pattern: $event })" />
        </mat-form-field>

        <mat-form-field>
          <mat-label>{{ i18n.t('ui.defaultValue') }}</mat-label>
          <input matInput [disabled]="readonly()" [ngModel]="field().defaultValue" (ngModelChange)="update.emit({ defaultValue: $event })" />
        </mat-form-field>

        <mat-form-field class="field-span-full">
          <mat-label>{{ i18n.t('ui.scriptJexl') }}</mat-label>
          <textarea matInput rows="4" [disabled]="readonly()" [ngModel]="field().script" (ngModelChange)="update.emit({ script: $event })"></textarea>
        </mat-form-field>

        <div class="field-span-full">
          <ih-reader-script-help />
        </div>

        <div class="field-toggle field-span-full">
          <mat-checkbox [disabled]="readonly()" [ngModel]="field().required" (ngModelChange)="update.emit({ required: $event })">
            {{ i18n.t('ui.required') }}
          </mat-checkbox>
        </div>
      </div>

      @if (!readonly()) {
        <div class="field-actions">
          <button mat-stroked-button type="button" (click)="remove.emit()">
            {{ i18n.t('ui.remove') }}
          </button>
        </div>
      }
    </mat-expansion-panel>
  `,
  styles: [
    `
      .field-panel {
        border: 1px solid var(--ih-border);
        border-radius: 12px !important;
        background: color-mix(in srgb, var(--ih-surface) 20%, transparent);
        box-shadow: none !important;
        margin: 0 !important;
        transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
      }
      .field-panel--active {
        border-color: color-mix(in srgb, var(--ih-accent) 48%, var(--ih-border));
        background: color-mix(in srgb, var(--ih-accent) 7%, var(--ih-surface-alt));
        box-shadow: inset 3px 0 0 var(--ih-accent);
      }
      .field-panel__header {
        min-height: 46px;
        padding-inline: 0.85rem;
      }
      .field-panel__header.mat-expanded {
        min-height: 48px;
      }
      .field-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.55rem;
        padding-top: 0.1rem;
      }
      .field-span-full {
        grid-column: 1 / -1;
      }
      .field-toggle {
        display: flex;
        align-items: center;
        min-height: 36px;
        padding-top: 0.1rem;
      }
      .field-actions {
        display: flex;
        justify-content: flex-end;
        padding-top: 0.25rem;
      }
      @container (max-width: 900px) {
        .field-grid {
          grid-template-columns: 1fr;
        }
        .field-span-full {
          grid-column: auto;
        }
      }
    `,
  ],
})
export class ReaderFieldDefinitionPanelComponent {
  readonly i18n = inject(I18nService);

  readonly index = input.required<number>();
  readonly field = input.required<ReaderFieldDraft>();
  readonly variant = input<ReaderFieldVariant>('position');
  readonly readonly = input(false);
  readonly expanded = input(false);
  readonly active = input(false);

  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly activated = output<void>();
  readonly update = output<Partial<ReaderFieldDraft>>();
  readonly remove = output<void>();

  summary(): string {
    const field = this.field();
    const parts: string[] = [];
    if (this.variant() === 'range') {
      parts.push(
        field.start || field.end
          ? `${field.start || '?'}-${field.end || '?'}`
          : this.i18n.t('ui.fieldSummary.derived')
      );
    } else {
      parts.push(
        field.position
          ? this.i18n.t('ui.fieldSummary.position', { value: field.position })
          : this.i18n.t('ui.fieldSummary.derived')
      );
    }
    parts.push(this.i18n.t('ui.fieldSummary.type', { value: field.type || 'TEXT' }));
    if (field.required) {
      parts.push(this.i18n.t('ui.fieldSummary.required'));
    }
    return parts.join(' | ');
  }
}



