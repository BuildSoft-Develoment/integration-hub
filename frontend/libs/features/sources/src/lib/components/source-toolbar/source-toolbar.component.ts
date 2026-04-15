import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SourceProviderDescriptor, SourceProviderType } from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';
import { inject } from '@angular/core';

type SourceStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Component({
  selector: 'ih-source-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="toolbar-shell ih-catalog-toolbar">
      <div class="toolbar-heading ih-catalog-toolbar__heading">
        <div class="toolbar-copy ih-catalog-toolbar__copy">
          <h2 class="ih-section-title">{{ i18n.t('sources.title') }}</h2>
          <p class="ih-muted">{{ i18n.t('sources.subtitle') }}</p>
        </div>

        @if (canEdit()) {
          <button mat-flat-button type="button" class="create-button ih-catalog-action" (click)="create.emit()">
            {{ i18n.t('sources.create') }}
          </button>
        }
      </div>

      <div class="toolbar-filters ih-catalog-toolbar__filters">
        <mat-form-field class="toolbar-search">
          <mat-label>{{ i18n.t('sources.search') }}</mat-label>
          <input
            matInput
            [ngModel]="search()"
            (ngModelChange)="searchChange.emit($event)"
          />
        </mat-form-field>

        <mat-form-field class="toolbar-select">
          <mat-label>{{ i18n.t('common.type') }}</mat-label>
          <mat-select
            [ngModel]="typeFilter()"
            (ngModelChange)="typeFilterChange.emit($event)"
          >
            <mat-option value="ALL">{{ i18n.t('sources.allTypes') }}</mat-option>
            @for (provider of providerOptions(); track provider.type) {
              <mat-option [value]="provider.type">{{ provider.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field class="toolbar-select">
          <mat-label>{{ i18n.t('common.status') }}</mat-label>
          <mat-select
            [ngModel]="statusFilter()"
            (ngModelChange)="statusFilterChange.emit($event)"
          >
            <mat-option value="ALL">{{ i18n.t('sources.allStatuses') }}</mat-option>
            <mat-option value="ACTIVE">{{ i18n.t('status.active') }}</mat-option>
            <mat-option value="INACTIVE">{{ i18n.t('status.inactive') }}</mat-option>
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
export class SourceToolbarComponent {
  readonly i18n = inject(I18nService);

  readonly search = input('');
  readonly typeFilter = input<'ALL' | SourceProviderType>('ALL');
  readonly statusFilter = input<SourceStatusFilter>('ALL');
  readonly canEdit = input(false);
  readonly providerOptions = input.required<readonly SourceProviderDescriptor[]>();

  readonly searchChange = output<string>();
  readonly typeFilterChange = output<'ALL' | SourceProviderType>();
  readonly statusFilterChange = output<SourceStatusFilter>();
  readonly create = output<void>();
}
