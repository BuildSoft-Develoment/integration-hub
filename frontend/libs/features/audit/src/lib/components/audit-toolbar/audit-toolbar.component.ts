import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService } from '@integration-hub/core/services';

@Component({
  selector: 'ih-audit-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="toolbar-shell ih-catalog-toolbar">
      <div class="toolbar-copy ih-catalog-toolbar__copy">
        <h2 class="ih-section-title">{{ i18n.t('audit.title') }}</h2>
        <p class="ih-muted">{{ i18n.t('audit.subtitle') }}</p>
      </div>

      <div class="toolbar-filters ih-catalog-toolbar__filters">
        <mat-form-field class="toolbar-search">
          <mat-label>{{ i18n.t('audit.search') }}</mat-label>
          <input matInput [ngModel]="search()" (ngModelChange)="searchChange.emit($event)" />
        </mat-form-field>

        <mat-form-field class="toolbar-select">
          <mat-label>{{ i18n.t('audit.eventType') }}</mat-label>
          <mat-select [ngModel]="eventTypeFilter()" (ngModelChange)="eventTypeFilterChange.emit($event)">
            <mat-option value="ALL">{{ i18n.t('audit.allEventTypes') }}</mat-option>
            @for (item of eventTypeOptions(); track item) {
              <mat-option [value]="item">{{ item }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field class="toolbar-select">
          <mat-label>{{ i18n.t('common.status') }}</mat-label>
          <mat-select [ngModel]="statusFilter()" (ngModelChange)="statusFilterChange.emit($event)">
            <mat-option value="ALL">{{ i18n.t('audit.allStatuses') }}</mat-option>
            <mat-option value="COMPLETED">{{ i18n.t('audit.status.COMPLETED') }}</mat-option>
            <mat-option value="FAILED">{{ i18n.t('audit.status.FAILED') }}</mat-option>
            <mat-option value="PENDING">{{ i18n.t('audit.status.PENDING') }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </section>
  `,
  styles: [`
    .toolbar-shell {}
  `],
})
export class AuditToolbarComponent {
  readonly i18n = inject(I18nService);

  readonly search = input('');
  readonly eventTypeFilter = input('ALL');
  readonly statusFilter = input<'ALL' | 'COMPLETED' | 'FAILED' | 'PENDING'>('ALL');
  readonly eventTypeOptions = input.required<readonly string[]>();

  readonly searchChange = output<string>();
  readonly eventTypeFilterChange = output<string>();
  readonly statusFilterChange = output<'ALL' | 'COMPLETED' | 'FAILED' | 'PENDING'>();
}
