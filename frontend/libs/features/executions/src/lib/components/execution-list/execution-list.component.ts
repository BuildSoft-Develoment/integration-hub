import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DateTimeService, I18nService } from '@integration-hub/core/services';
import { formatTriggerSourceLabel } from '../../execution-detail.utils';
import { ProcessExecutionRecord } from '../../execution.models';

@Component({
  selector: 'ih-execution-list',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatPaginatorModule],
  template: `
    <div class="list-card ih-catalog-list">
      <div class="table-head ih-catalog-table-head">
        <span>{{ i18n.t('common.name') }}</span>
        <span>{{ i18n.t('common.status') }}</span>
        <span>{{ i18n.t('executions.finishedAt') }}</span>
      </div>

      <div class="table-body ih-catalog-table-body ih-thin-scroll">
        @for (execution of executions(); track execution.id) {
          <button
            type="button"
            class="table-row ih-catalog-table-row"
            [class.table-row--selected]="selectedExecutionId() === execution.id"
            [class.ih-catalog-table-row--selected]="selectedExecutionId() === execution.id"
            (click)="selectExecution.emit(execution)"
          >
            <div class="row-primary ih-catalog-row-primary">
              <div class="row-avatar ih-catalog-row-avatar">{{ execution.processName.slice(0, 1).toUpperCase() }}</div>
              <div class="row-copy ih-catalog-row-copy">
                <strong>{{ execution.processName }}</strong>
                <small>ID {{ execution.id }} · Proceso {{ execution.processDefinitionId }}</small>
                @if (execution.sourceExecutionId) {
                  <small class="row-linkage">Origen #{{ execution.sourceExecutionId }}</small>
                }
              </div>
            </div>

            <div class="row-type ih-catalog-row-meta">
              <mat-chip-set>
                <mat-chip>{{ statusLabel(execution.status) }}</mat-chip>
                @if (execution.triggerSource) {
                  <mat-chip>{{ triggerLabel(execution.triggerSource) }}</mat-chip>
                }
              </mat-chip-set>
            </div>

            <div class="row-status ih-catalog-row-meta">
              <div class="row-dates">
                <span>{{ formatDate(execution.finishedAt || execution.startedAt) }}</span>
                <small>{{ i18n.t('executions.startedAt') }} {{ formatDate(execution.startedAt) }}</small>
              </div>
            </div>
          </button>
        } @empty {
          <div class="empty-state ih-catalog-empty-state ih-muted">{{ i18n.t('executions.noData') }}</div>
        }
      </div>

      <mat-paginator class="list-paginator ih-catalog-paginator" [length]="totalLength()" [pageIndex]="pageIndex()" [pageSize]="pageSize()" [pageSizeOptions]="pageSizeOptions()" [hidePageSize]="false" [showFirstLastButtons]="false" (page)="onPageChange($event)" />
    </div>
  `,
  styles: [`
      :host { display:block; min-height:0; height:100%; }
      .row-status { font-size: 0.86rem; color: var(--ih-text-soft); }
      .row-dates { display:grid; gap:0.18rem; }
      .row-dates small, .row-linkage { color: var(--ih-text-soft); }
    `],
})
export class ExecutionListComponent {
  readonly i18n = inject(I18nService);
  readonly dateTime = inject(DateTimeService);
  readonly executions = input.required<readonly ProcessExecutionRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedExecutionId = input<number | null>(null);
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);
  readonly selectExecution = output<ProcessExecutionRecord>();
  readonly pageChange = output<PageEvent>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  statusLabel(status: string): string {
    return this.i18n.t(`executionStatus.${status}`);
  }

  triggerLabel(status: string): string {
    return formatTriggerSourceLabel(status);
  }

  formatDate(value: string | null): string {
    return value ? this.dateTime.formatIso(value) : '-';
  }
}
