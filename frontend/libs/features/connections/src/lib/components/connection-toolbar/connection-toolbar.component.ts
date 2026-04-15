import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  ConnectionProviderDescriptor,
  ConnectionProviderType,
} from '@integration-hub/core/providers';
import { I18nService } from '@integration-hub/core/services';

type ConnectionStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Component({
  selector: 'ih-connection-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="toolbar-shell ih-catalog-toolbar">
      <div class="toolbar-heading ih-catalog-toolbar__heading">
        <div class="toolbar-copy ih-catalog-toolbar__copy">
          <h2 class="ih-section-title">{{ i18n.t('connections.title') }}</h2>
          <p class="ih-muted">{{ i18n.t('connections.subtitle') }}</p>
        </div>

        @if (canEdit()) {
          <button mat-flat-button type="button" class="create-button ih-catalog-action" (click)="create.emit()">
            {{ i18n.t('connections.create') }}
          </button>
        }
      </div>

      <div class="toolbar-filters ih-catalog-toolbar__filters">
        <mat-form-field class="toolbar-search">
          <mat-label>{{ i18n.t('connections.search') }}</mat-label>
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
            <mat-option value="ALL">{{ i18n.t('connections.allTypes') }}</mat-option>
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
export class ConnectionToolbarComponent {
  readonly i18n = inject(I18nService);

  readonly search = input('');
  readonly typeFilter = input<'ALL' | ConnectionProviderType>('ALL');
  readonly statusFilter = input<ConnectionStatusFilter>('ALL');
  readonly canEdit = input(false);
  readonly providerOptions = input.required<readonly ConnectionProviderDescriptor[]>();

  readonly searchChange = output<string>();
  readonly typeFilterChange = output<'ALL' | ConnectionProviderType>();
  readonly statusFilterChange = output<ConnectionStatusFilter>();
  readonly create = output<void>();
}
