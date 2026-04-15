import { CommonModule } from '@angular/common';
import { Component, input, output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReaderProviderDescriptor, ReaderProviderType } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';

@Component({
  selector: 'ih-reader-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="toolbar-shell ih-catalog-toolbar">
      <div class="toolbar-heading ih-catalog-toolbar__heading">
        <div class="toolbar-copy ih-catalog-toolbar__copy">
          <h2 class="ih-section-title">{{ i18n.t('readers.title') }}</h2>
          <p class="ih-muted">{{ i18n.t('readers.subtitle') }}</p>
        </div>

        @if (canEdit()) {
          <button mat-flat-button type="button" class="create-button ih-catalog-action" (click)="create.emit()">
            {{ i18n.t('readers.create') }}
          </button>
        }
      </div>

      <div class="toolbar-filters ih-catalog-toolbar__filters">
        <mat-form-field class="toolbar-search">
          <mat-label>{{ i18n.t('readers.search') }}</mat-label>
          <input matInput [ngModel]="search()" (ngModelChange)="searchChange.emit($event)" />
        </mat-form-field>

        <mat-form-field class="toolbar-select">
          <mat-label>{{ i18n.t('common.type') }}</mat-label>
          <mat-select [ngModel]="typeFilter()" (ngModelChange)="typeFilterChange.emit($event)">
            <mat-option value="ALL">{{ i18n.t('readers.allTypes') }}</mat-option>
            @for (provider of providerOptions(); track provider.type) {
              <mat-option [value]="provider.type">{{ provider.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>
    </section>
  `,
  styles: [
    `
      .create-button { justify-self: start; }
    `,
  ],
})
export class ReaderToolbarComponent {
  readonly i18n = inject(I18nService);

  readonly search = input('');
  readonly typeFilter = input<'ALL' | ReaderProviderType>('ALL');
  readonly canEdit = input(false);
  readonly providerOptions = input.required<readonly ReaderProviderDescriptor[]>();

  readonly searchChange = output<string>();
  readonly typeFilterChange = output<'ALL' | ReaderProviderType>();
  readonly create = output<void>();
}
