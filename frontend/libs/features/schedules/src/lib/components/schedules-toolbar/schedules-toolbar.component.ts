import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService } from '@integration-hub/core/services';

@Component({
  selector: 'ih-schedules-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="toolbar-shell ih-catalog-toolbar">
      <div class="toolbar-copy ih-catalog-toolbar__copy">
        <h2 class="ih-section-title">{{ i18n.t('schedules.title') }}</h2>
        <p class="ih-muted">{{ i18n.t('schedules.subtitle') }}</p>
      </div>

      <div class="toolbar-filters ih-catalog-toolbar__filters">
        <mat-form-field class="toolbar-search">
          <mat-label>{{ i18n.t('schedules.search') }}</mat-label>
          <input matInput [ngModel]="search()" (ngModelChange)="searchChange.emit($event)" />
        </mat-form-field>

        <mat-form-field class="toolbar-select">
          <mat-label>{{ i18n.t('processes.mode') }}</mat-label>
          <mat-select [ngModel]="modeFilter()" (ngModelChange)="modeFilterChange.emit($event)">
            <mat-option value="ALL">{{ i18n.t('processes.selectScheduleMode') }}</mat-option>
            <mat-option value="SCHEDULED">{{ i18n.t('status.scheduled') }}</mat-option>
            <mat-option value="MANUAL">{{ i18n.t('status.manual') }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="toolbar-select">
          <mat-label>{{ i18n.t('common.status') }}</mat-label>
          <mat-select [ngModel]="statusFilter()" (ngModelChange)="statusFilterChange.emit($event)">
            <mat-option value="ALL">{{ i18n.t('schedules.allStatuses') }}</mat-option>
            <mat-option value="ACTIVE">{{ i18n.t('status.active') }}</mat-option>
            <mat-option value="INACTIVE">{{ i18n.t('status.inactive') }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <button mat-stroked-button type="button" class="create-button ih-catalog-action" (click)="refresh.emit()">
        {{ i18n.t('common.refresh') }}
      </button>
    </section>
  `,
  styles: [`
    .toolbar-shell { grid-template-columns:minmax(0,1fr); }
    .toolbar-copy { min-width:0; }
    .toolbar-filters {
      display:grid;
      grid-template-columns:repeat(3, minmax(0, 1fr));
      gap:0.8rem;
      align-items:center;
      min-width:0;
    }
    .toolbar-filters > * { min-width:0; }
    .toolbar-search,
    .toolbar-select { display:block; width:100%; min-width:0; }
    .toolbar-search .mat-mdc-form-field,
    .toolbar-select .mat-mdc-form-field { width:100%; }
    .create-button { justify-self:start; }
    @media (max-width: 1180px) {
      .toolbar-filters {
        grid-template-columns:1fr;
      }
    }
    @media (max-width: 760px) {
      .create-button {
        width:100%;
      }
    }
  `],
})
export class SchedulesToolbarComponent {
  readonly i18n = inject(I18nService);

  readonly search = input('');
  readonly modeFilter = input<'ALL' | 'SCHEDULED' | 'MANUAL'>('ALL');
  readonly statusFilter = input<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  readonly searchChange = output<string>();
  readonly modeFilterChange = output<'ALL' | 'SCHEDULED' | 'MANUAL'>();
  readonly statusFilterChange = output<'ALL' | 'ACTIVE' | 'INACTIVE'>();
  readonly refresh = output<void>();
}
