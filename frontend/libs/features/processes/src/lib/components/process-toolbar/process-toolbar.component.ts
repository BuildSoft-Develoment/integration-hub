import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService } from '@integration-hub/core/services';

type ScheduleFilter = 'ALL' | 'MANUAL' | 'SCHEDULED';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Component({
  selector: 'ih-process-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="toolbar-shell ih-catalog-toolbar">
      <div class="toolbar-heading ih-catalog-toolbar__heading">
        <div class="toolbar-copy ih-catalog-toolbar__copy">
          <h2 class="ih-section-title">{{ i18n.t('processes.title') }}</h2>
          <p class="ih-muted">{{ i18n.t('processes.subtitle') }}</p>
        </div>

        @if (canEdit()) {
          <button mat-flat-button type="button" class="create-button ih-catalog-action" (click)="create.emit()">
            {{ i18n.t('processes.create') }}
          </button>
        }
      </div>

      <div class="toolbar-filters ih-catalog-toolbar__filters">
        <mat-form-field class="toolbar-search">
          <mat-label>{{ i18n.t('processes.search') }}</mat-label>
          <input matInput [ngModel]="search()" (ngModelChange)="searchChange.emit($event)" />
        </mat-form-field>

        <mat-form-field class="toolbar-select">
          <mat-label>{{ i18n.t('processes.mode') }}</mat-label>
          <mat-select [ngModel]="scheduleFilter()" (ngModelChange)="scheduleFilterChange.emit($event)">
            <mat-option value="ALL">{{ i18n.t('processes.selectScheduleMode') }}</mat-option>
            <mat-option value="MANUAL">{{ i18n.t('status.manual') }}</mat-option>
            <mat-option value="SCHEDULED">{{ i18n.t('status.scheduled') }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="toolbar-select">
          <mat-label>{{ i18n.t('common.status') }}</mat-label>
          <mat-select [ngModel]="statusFilter()" (ngModelChange)="statusFilterChange.emit($event)">
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
export class ProcessToolbarComponent {
  readonly i18n = inject(I18nService);

  readonly search = input('');
  readonly scheduleFilter = input<ScheduleFilter>('ALL');
  readonly statusFilter = input<StatusFilter>('ALL');
  readonly canEdit = input(false);

  readonly searchChange = output<string>();
  readonly scheduleFilterChange = output<ScheduleFilter>();
  readonly statusFilterChange = output<StatusFilter>();
  readonly create = output<void>();
}
