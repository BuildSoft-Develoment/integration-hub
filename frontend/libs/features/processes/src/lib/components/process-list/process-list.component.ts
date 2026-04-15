import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { I18nService } from '@integration-hub/core/services';
import { ProcessRecord } from '../../process.models';

@Component({
  selector: 'ih-process-list',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatPaginatorModule],
  template: `
    <div class="list-card ih-catalog-list">
      <div class="table-head ih-catalog-table-head">
        <span>{{ i18n.t('common.name') }}</span>
        <span>{{ i18n.t('processes.mode') }}</span>
        <span>{{ i18n.t('common.status') }}</span>
      </div>

      <div class="table-body ih-catalog-table-body ih-thin-scroll">
        @for (process of processes(); track process.id) {
          <button
            type="button"
            class="table-row ih-catalog-table-row"
            [class.table-row--selected]="selectedProcessId() === process.id"
            [class.ih-catalog-table-row--selected]="selectedProcessId() === process.id"
            (click)="selectProcess.emit(process)"
          >
            <div class="row-primary ih-catalog-row-primary">
              <div class="row-avatar ih-catalog-row-avatar">{{ process.name.slice(0, 1).toUpperCase() }}</div>
              <div class="row-copy ih-catalog-row-copy">
                <strong>{{ process.name }}</strong>
                <small>ID {{ process.id }}</small>
              </div>
            </div>

            <div class="row-type ih-catalog-row-meta">
              <mat-chip-set>
                <mat-chip>{{ process.scheduled ? i18n.t('status.scheduled') : i18n.t('status.manual') }}</mat-chip>
              </mat-chip-set>
            </div>

            <div class="row-status" [class.row-status--inactive]="!process.active">
              <span class="status-dot"></span>
              {{ process.active ? i18n.t('status.active') : i18n.t('status.inactive') }}
            </div>
          </button>
        } @empty {
          <div class="empty-state ih-catalog-empty-state ih-muted">{{ i18n.t('processes.noData') }}</div>
        }
      </div>

      <mat-paginator
        class="list-paginator ih-catalog-paginator"
        [length]="totalLength()"
        [pageIndex]="pageIndex()"
        [pageSize]="pageSize()"
        [pageSizeOptions]="pageSizeOptions()"
        [hidePageSize]="false"
        [showFirstLastButtons]="false"
        (page)="onPageChange($event)"
      />
    </div>
  `,
  styles: [
    `
      .row-type,
      .row-status {
        display: flex;
        align-items: center;
      }
      .row-status {
        gap: 0.45rem;
        color: #166534;
        font-size: 0.86rem;
        font-weight: 600;
      }
      .row-status--inactive {
        color: #b45309;
      }
      .status-dot {
        width: 0.52rem;
        height: 0.52rem;
        border-radius: 999px;
        background: currentColor;
      }
      @media (max-height: 700px) and (min-width: 761px) {
        .row-copy small,
        .row-status {
          font-size: 0.8rem;
        }
      }
    `,
  ],
})
export class ProcessListComponent {
  readonly i18n = inject(I18nService);

  readonly processes = input.required<readonly ProcessRecord[]>();
  readonly totalLength = input.required<number>();
  readonly selectedProcessId = input<number | null>(null);
  readonly pageIndex = input(0);
  readonly pageSize = input(8);
  readonly pageSizeOptions = input<readonly number[]>([8, 16, 24]);

  readonly selectProcess = output<ProcessRecord>();
  readonly pageChange = output<PageEvent>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}
