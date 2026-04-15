import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { I18nService } from '@integration-hub/core/services';

type ExecutionStatusFilter = 'ALL' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'COMPLETED_WITH_ERRORS';

@Component({
  selector: 'ih-execution-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="toolbar-shell ih-catalog-toolbar">
      <div class="toolbar-heading ih-catalog-toolbar__heading">
        <div class="toolbar-copy ih-catalog-toolbar__copy">
          <h2 class="ih-section-title">{{ i18n.t('executions.title') }}</h2>
          <p class="ih-muted">{{ i18n.t('executions.subtitle') }}</p>
        </div>
      </div>

      <div class="toolbar-filters ih-catalog-toolbar__filters">
        <mat-form-field class="toolbar-search">
          <mat-label>{{ i18n.t('executions.search') }}</mat-label>
          <input matInput [ngModel]="search()" (ngModelChange)="searchChange.emit($event)" />
        </mat-form-field>

        <mat-form-field class="toolbar-select">
          <mat-label>{{ i18n.t('common.status') }}</mat-label>
          <mat-select [ngModel]="statusFilter()" (ngModelChange)="statusFilterChange.emit($event)">
            <mat-option value="ALL">{{ i18n.t('sources.allStatuses') }}</mat-option>
            <mat-option value="RUNNING">{{ i18n.t('executionStatus.RUNNING') }}</mat-option>
            <mat-option value="COMPLETED">{{ i18n.t('executionStatus.COMPLETED') }}</mat-option>
            <mat-option value="FAILED">{{ i18n.t('executionStatus.FAILED') }}</mat-option>
            <mat-option value="COMPLETED_WITH_ERRORS">{{ i18n.t('executionStatus.COMPLETED_WITH_ERRORS') }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </section>
  `,
  styles: [`
      .toolbar-heading { grid-template-columns: minmax(0, 1fr); }
      .toolbar-filters { grid-template-columns: minmax(280px, 1.6fr) minmax(170px, 0.8fr); }
    `],
})
export class ExecutionToolbarComponent {
  readonly i18n = inject(I18nService);
  readonly search = input('');
  readonly statusFilter = input<ExecutionStatusFilter>('ALL');
  readonly searchChange = output<string>();
  readonly statusFilterChange = output<ExecutionStatusFilter>();
}
